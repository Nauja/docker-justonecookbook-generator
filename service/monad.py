__all__ = ["generate"]
import os
import subprocess
import tempfile
import hashlib
import shlex
import yaml
import shutil
import asyncio


def run_pandoc(*, command: str, templates_dir: str):
    async def wrapper(content: str, *, template: str, destination: str):
        def absolute_path(_):
            return '"{}"'.format(os.path.abspath(_))

        template_dir = os.path.join(templates_dir, template)

        argv = shlex.split(
            command.format(
                html=absolute_path(os.path.join(template_dir, "index.html")),
                css=absolute_path(os.path.join(template_dir, "index.css")),
                destination=absolute_path(destination)
            )
        )

        p = await asyncio.create_subprocess_exec(
            *argv,
            stdin=asyncio.subprocess.PIPE
        )

        await p.communicate(input=content)
        await p.wait()
        if p.returncode != 0:
            raise Exception(
                "{} failed with exit code {}".format(argv, p.returncode)
            )

    return wrapper


def generate_recipe(
    *,
    pandoc,
    recipes_output_dir: str
):
    async def wrapper(
        content: str,
        *,
        template: str
    ):
        '''Generate a recipe from YAML to PDF.

        May throw an exception in case of IO error.

        :param pandoc: run pandoc commandline
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

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        try:
            tmp.close()

            await pandoc(
                content=c,
                template=template,
                destination=tmp.name
            )

            shutil.copyfile(tmp.name, destination)

            return filename
        finally:
            os.remove(tmp.name)

    return wrapper
