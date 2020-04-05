import os
from aiohttp import web
import aiohttp_jinja2
import aiorest
from aiorest.utils import check_exceptions, validate_required_params
from service import monad
from typing import Callable, Any, List


def GenerateView(
    *,
    generate_recipe: Callable[[str], Any],
    cdn_url: str
) -> web.View:
    class Wrapper(web.View):

        @check_exceptions
        @validate_required_params(names=["recipe", "template"])
        async def post(self, required_params, **_):
            try:
                filename = generate_recipe(
                    required_params["recipe"],
                    template=required_params["template"]
                )
            except Exception:
                raise aiorest.ErrorResponse(code=1, desc="failed to generate recipe")

            return {"result": "{}/recipe/{}".format(cdn_url, filename)}

    return Wrapper


def EditorView(*, templates: str, cdn_url: str) -> web.View:
    class Wrapper(web.View):

        @aiohttp_jinja2.template('index.html')
        async def get(self, **_):
            return {"templates": templates, "cdn_url": cdn_url}

    return Wrapper


class Application(aiorest.AioRESTApplication):
    def __init__(
        self,
        *args,
        generate_recipe,
        pandoc_templates: List[str],
        cdn_url: str,
        base_url: str=None,
        **kwargs
    ):
        super(Application, self).__init__(*args, **kwargs)

        base_url = base_url or "/"
        self.router.add_view(
            base_url + "generate",
            GenerateView(
                generate_recipe=generate_recipe,
                cdn_url=cdn_url
            )
        )
        self.router.add_view(
            base_url,
            EditorView(
                templates=pandoc_templates,
                cdn_url=cdn_url
            )
        )
