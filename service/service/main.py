import argparse
import aiorest
import aiohttp_jinja2
import jinja2
import logging
from service.app import Application
from service import monad


def main():
    parser = argparse.ArgumentParser(prog="Service", description="Help")
    parser.add_argument(
        "--config", type=str, default="service.cnf", help="configuration file"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbosity level")
    args = parser.parse_args()

    config = aiorest.load_config(args.config)

    logging.basicConfig(level=logging.INFO)

    aiorest.setup_logging(
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
    app.run(port=config["service"]["port"])


if __name__ == "__main__":
    main()
