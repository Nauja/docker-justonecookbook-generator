import os
import argparse
from aiohttp import web
import aiohttp_jinja2
import jinja2
import logging
from service.app import Application
from service import monad, configuration
from builtins import int


def setup_logging(
    *,
    access_logfile=None,
    access_maxbytes=None,
    access_backupcount=None,
    error_logfile=None,
    error_maxbytes=None,
    error_backupcount=None
):
    """Setup logging handlers.

    This setup two `RotatingFileHandler` for `aiohttp.access` and `aiohttp.server` logs.

    :param access_logfile: path for access logfile or `None`
    :param access_maxbytes: max bytes per access logfile
    :param access_backupcount: max number of access logfile to keep
    :param error_logfile: path for error logfile or `None`
    :param error_maxbytes: max bytes per error logfile
    :param error_backupcount: max number of error logfile to keep
    """
    from logging.handlers import RotatingFileHandler

    if access_logfile:
        logging.getLogger("aiohttp.access").addHandler(
            RotatingFileHandler(
                access_logfile,
                maxBytes=access_maxbytes,
                backupCount=access_backupcount,
            )
        )
    if error_logfile:
        logging.getLogger("aiohttp.server").addHandler(
            RotatingFileHandler(
                error_logfile,
                maxBytes=error_maxbytes,
                backupCount=error_backupcount,
            )
        )


def run(
    *,
    cdn_url: str,
    port: int,
    recipes_output_dir: str,
    jinja2_templates_dir: str,
    pandoc_templates_dir: str,
    pandoc_command: str,
    htmltopdf_command: str
):
    os.makedirs(recipes_output_dir, exist_ok=True)

    app = Application(
        generate_recipe=monad.generate_recipe(
            pandoc=monad.run_pandoc(
                command=pandoc_command,
                templates_dir=pandoc_templates_dir
            ),
            htmltopdf=monad.run_htmltopdf(
                command=htmltopdf_command,
            ),
            recipes_output_dir=recipes_output_dir
        ),
        pandoc_templates=os.listdir(pandoc_templates_dir),
        cdn_url=cdn_url
    )
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(jinja2_templates_dir)
    )
    web.run_app(app, port=port)


def main():
    parser = argparse.ArgumentParser(prog="Service", description="Help")
    parser.add_argument(
        "directory", type=str, help="config directory"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbosity level")
    args = parser.parse_args()

    config_dir = args.directory
    if not os.path.isdir(config_dir):
        raise NotADirectoryError(config_dir)

    config = configuration.load(os.path.join(config_dir, "config.cnf"))

    logging.basicConfig(level=logging.INFO)

    setup_logging(
        access_logfile=config["logging"].get("access-logfile", None),
        access_maxbytes=int(config["logging"].get("access-maxbytes", None)),
        access_backupcount=int(config["logging"].get("access-backupcount", None)),
        error_logfile=config["logging"].get("error-logfile", None),
        error_maxbytes=int(config["logging"].get("error-maxbytes", None)),
        error_backupcount=int(config["logging"].get("error-backupcount", None)),
    )

    run(
        cdn_url=config["service"]["cdn-url"],
        port=int(config["service"]["port"]),
        recipes_output_dir=config["service"]["recipes-output-dir"],
        jinja2_templates_dir=config_dir,
        pandoc_templates_dir=os.path.join(config_dir, "templates-enabled"),
        pandoc_command=config["service"]["pandoc-command"],
        htmltopdf_command=config["service"]["htmltopdf-command"]
    )


if __name__ == "__main__":
    main()
