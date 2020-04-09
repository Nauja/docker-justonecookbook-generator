import os
import logging
import json
from aiohttp import web
import aiohttp_jinja2
from typing import Callable, Any, List


def validate_required_params(_fun=None, *, names):
    """Validate that a query has all required parameters.

    Role of this decorator is to force returning a `web.HTTPForbidden`
    with an explicit message when one of required query parameters
    is missing.

    This will call the wrapped function with a dict containing
    all required parameters values.

    :param names: list of required parameters
    :return: result of wrapped function or `web.HTTPForbidden`
    """

    def wrapper(fun):
        async def run(self: web.View, *args, **kwargs):
            # Note that `self` is a `web.View` object.
            query = self.request.rel_url.query
            # Decode POST parameters
            if self.request.body_exists and self.request.content_type.endswith("json"):
                data = await self.request.json()
            else:
                data = {}
            # Check and get all parameters
            vals = {}
            for name in names:
                val = data.get(name, None) or query.get(name, None)
                if not val:
                    raise web.HTTPForbidden(
                        reason="{} parameter is required".format(name)
                    )
                vals[name] = val
            # Forward parameters to wrapped functions
            return await fun(self, *args, required_params=vals, **kwargs)

        return run

    return wrapper if not _fun else wrapper(_fun)


def GenerateView(
    *,
    generate_recipe: Callable[[str], Any]
) -> web.View:
    class Wrapper(web.View):

        @validate_required_params(names=["recipe", "template"])
        async def post(self, required_params, **_):
            try:
                filename = await generate_recipe(
                    required_params["recipe"],
                    template=required_params["template"]
                )
            except Exception as e:
                logging.getLogger("aiohttp.server").exception(e)
                raise web.HTTPInternalServerError(reason="failed to generate PDF")

            return web.Response(
                text=json.dumps({
                    "result": "Ok",
                    "params": {
                        "result": "/recipe/{}".format(filename)
                    }
                })
            )

    return Wrapper


def EditorView(*, templates: str, cdn_url: str) -> web.View:
    class Wrapper(web.View):

        @aiohttp_jinja2.template('index.html')
        async def get(self, **_):
            return {"templates": templates, "cdn_url": cdn_url}

    return Wrapper


class Application(web.Application):
    def __init__(
        self,
        *args,
        generate_recipe,
        pandoc_templates: List[str],
        cdn_url: str,
        base_url: str=None,
        recipes_output_dir: str,
        **kwargs
    ):
        super(Application, self).__init__(*args, **kwargs)

        base_url = base_url or "/"
        self.router.add_view(
            base_url + "generate",
            GenerateView(
                generate_recipe=generate_recipe
            )
        )
        self.router.add_static(base_url + "recipe", recipes_output_dir)
        self.router.add_view(
            base_url,
            EditorView(
                templates=pandoc_templates,
                cdn_url=cdn_url
            )
        )
