__all__ = ["generate"]
import os
import subprocess
import tempfile
import hashlib
import shlex
import yaml


def generate_recipe(
    *,
    pandoc_templates_dir: str,
    recipes_output_dir: str,
    htmltopdf_command: str
):
    def wrapper(
        content: str,
        *,
        template: str
    ):
        '''Generate a recipe from YAML to PDF.

        May throw an exception in case of IO error.

        :param pandoc_templates_dir: directory containing pandoc templates
        :param recipes_output_dir: directory for generated recipes
        :param content: a YAML formatted recipe
        :param template: pandoc template to use
        :return: name of generated file in output_dir
        '''
        # Validate YAML input
        content = yaml.dump(yaml.safe_load(content))

        # Check output directory
        os.makedirs(recipes_output_dir, exist_ok=True)

        # Required for pandoc
        c = """---
{}
---""".format(content).encode()

        # Check file against MD5
        m = hashlib.md5()
        m.update(c)
        m.update(template.encode())
        filename = "{}.pdf".format(m.hexdigest())
        destination = os.path.join(
            recipes_output_dir,
            filename
        )

        tmp = tempfile.NamedTemporaryFile(delete=True, mode="w+", encoding="utf-8")
        try:
            # Generate recipe using pandoc
            template_dir = os.path.join(pandoc_templates_dir, template)

            def absolute_path(_):
                return '"{}"'.format(os.path.abspath(_))

            argv = [
                "pandoc",
                "--template", os.path.join(template_dir, "index.html"),
                "--css", os.path.join(template_dir, "index.css"),
                "--self-contained"
            ]

            p = subprocess.run(
                argv,
                input=c,
                stdout=tmp
            )
            if p.returncode != 0:
                raise Exception(
                    "{} failed with exit code {}".format(argv, p.returncode)
                )

            # Convert from HTML to PDF
            argv = shlex.split(
                htmltopdf_command.format(
                    destination=absolute_path(destination)
                )
            )

            tmp.seek(0)
            p = subprocess.run(
                argv,
                stdin=tmp
            )
            if p.returncode != 0:
                raise Exception(
                    "{} failed with exit code {}".format(argv, p.returncode)
                )

            return filename
        finally:
            # Make sure temp file is deleted
            tmp.close()

    return wrapper
