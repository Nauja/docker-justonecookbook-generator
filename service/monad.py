__all__ = ["generate"]
import os
import subprocess
import tempfile
import hashlib
import shlex
import yaml


def absolute_path(_):
    return '"{}"'.format(os.path.abspath(_))


def run_pandoc(*, command: str, templates_dir: str):
    def wrapper(content: str, *, template: str, stdout):
        template_dir = os.path.join(templates_dir, template)

        argv = shlex.split(
            command.format(
                html=absolute_path(os.path.join(template_dir, "index.html")),
                css=absolute_path(os.path.join(template_dir, "index.css"))
            )
        )

        p = subprocess.run(
            argv,
            input=content,
            stdout=stdout
        )

        if p.returncode != 0:
            raise Exception(
                "{} failed with exit code {}".format(argv, p.returncode)
            )

    return wrapper


def run_htmltopdf(*, command: str):
    def wrapper(destination: str, *, stdin):
        argv = shlex.split(
            command.format(
                destination=absolute_path(destination)
            )
        )

        p = subprocess.run(
            argv,
            stdin=stdin
        )

        if p.returncode != 0:
            raise Exception(
                "{} failed with exit code {}".format(argv, p.returncode)
            )

    return wrapper


def generate_recipe(
    *,
    pandoc,
    htmltopdf,
    recipes_output_dir: str
):
    def wrapper(
        content: str,
        *,
        template: str
    ):
        '''Generate a recipe from YAML to PDF.

        May throw an exception in case of IO error.

        :param pandoc: run pandoc commandline
        :param htmltopdf: run htmltopdf commandline
        :param recipes_output_dir: directory for generated recipes
        :param content: a YAML formatted recipe
        :param template: pandoc template to use
        :return: name of generated file in recipes_output_dir
        '''
        if not os.path.isdir(recipes_output_dir):
            raise NotADirectoryError(recipes_output_dir)

        # Validate YAML input
        content = yaml.dump(yaml.safe_load(content))

        # Required for pandoc
        c = """---\n{}\n---""".format(content).encode()

        # Check file against MD5
        m = hashlib.md5()
        m.update(c)
        m.update(template.encode())
        filename = "{}.pdf".format(m.hexdigest())
        destination = os.path.join(
            recipes_output_dir,
            filename
        )

        # Don't generate twice the same file
        if os.path.exists(destination):
            return filename

        tmp = tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8")
        try:
            pandoc(
                content=c,
                template=template,
                stdout=tmp
            )

            tmp.seek(0)

            htmltopdf(
                destination=destination,
                stdin=tmp
            )

            return filename
        finally:
            # Make sure temp file is deleted
            tmp.close()

    return wrapper
