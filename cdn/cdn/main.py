import argparse
import aiorest
import logging
from cdn.app import Application


def main():
    parser = argparse.ArgumentParser(prog="CDN", description="Help")
    parser.add_argument(
        "--config", type=str, default="cdn.cnf", help="configuration file"
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
        static_dir=config["service"]["static-dir"],
        recipes_output_dir=config["service"]["recipes-output-dir"],
        allow_cors_origin=config["service"]["allow-cors-origin"]
    )
    app.run(port=config["service"]["port"])


if __name__ == "__main__":
    main()
