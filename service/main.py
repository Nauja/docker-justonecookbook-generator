import argparse
from aiohttp import web
import aiohttp_jinja2
import jinja2
import logging
from service.app import Application
from service import monad


DEFAULT_LOGGING_MAXBYTES = 1000000
DEFAULT_LOGGING_BACKUPCOUNT = 5
DEFAULT_CONFIG = {
    "service": {
        "port": 8080,
        "base-url": "/",
        "cdn-url": ""
    },
    "logging": {
        "access-logfile": "",
        "access-maxbytes": DEFAULT_LOGGING_MAXBYTES,
        "access-backupcount": DEFAULT_LOGGING_BACKUPCOUNT,
        "error-logfile": "",
        "error-maxbytes": DEFAULT_LOGGING_MAXBYTES,
        "error-backupcount": DEFAULT_LOGGING_BACKUPCOUNT,
    },
    "ssl": {"certfile": "", "keyfile": ""},
}


def load_config(path):
    """Load the service configuration from file.

    Returns default parameters overriden by the ones in the configuration file.

    :param path: file to load
    :return: a dict containing loaded configuration
    """
    import configparser

    result = dict(DEFAULT_CONFIG)
    config = configparser.ConfigParser()
    config.read(path)
    for s in config.sections():
        result.setdefault(s, {}).update(config.items(s))

    result["service"]["port"] = int(result["service"]["port"])
    result["logging"]["access-maxbytes"] = int(result["logging"]["access-maxbytes"])
    result["logging"]["access-backupcount"] = int(
        result["logging"]["access-backupcount"]
    )
    result["logging"]["error-maxbytes"] = int(result["logging"]["error-maxbytes"])
    result["logging"]["error-backupcount"] = int(result["logging"]["error-backupcount"])
    return result


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
                maxBytes=access_maxbytes or DEFAULT_LOGGING_MAXBYTES,
                backupCount=access_backupcount or DEFAULT_LOGGING_BACKUPCOUNT,
            )
        )
    if error_logfile:
        logging.getLogger("aiohttp.server").addHandler(
            RotatingFileHandler(
                error_logfile,
                maxBytes=error_maxbytes or DEFAULT_LOGGING_MAXBYTES,
                backupCount=error_backupcount or DEFAULT_LOGGING_BACKUPCOUNT,
            )
        )


def main():
    parser = argparse.ArgumentParser(prog="Service", description="Help")
    parser.add_argument(
        "--config", type=str, default="service.cnf", help="configuration file"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbosity level")
    args = parser.parse_args()

    config = load_config(args.config)

    logging.basicConfig(level=logging.INFO)

    setup_logging(
        access_logfile=config["logging"].get("access-logfile", None),
        access_maxbytes=config["logging"].get("access-maxbytes", None),
        access_backupcount=config["logging"].get("access-backupcount", None),
        error_logfile=config["logging"].get("error-logfile", None),
        error_maxbytes=config["logging"].get("error-maxbytes", None),
        error_backupcount=config["logging"].get("error-backupcount", None),
    )

    app = Application(
        generate_recipe=monad.generate_recipe(
            pandoc_templates_dir=config["service"]["pandoc-templates-dir"],
            recipes_output_dir=config["service"]["recipes-output-dir"],
            wkhtmltopdf_bin=config["service"]["wkhtmltopdf-bin"]
        ),
        pandoc_templates=config["service"]["pandoc-templates"].split(','),
        cdn_url=config["service"]["cdn-url"]
    )
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(config["service"]["jinja2-templates-dir"])
    )
    web.run_app(app, port=config["service"]["port"])


if __name__ == "__main__":
    main()
