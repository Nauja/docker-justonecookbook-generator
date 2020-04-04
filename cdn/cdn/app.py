import aiorest
import os
import aiohttp_cors


class Application(aiorest.AioRESTApplication):
    def __init__(self, *args, allow_cors_origin: str, static_dir: str, recipes_output_dir: str, base_url: str=None, **kwargs):
        super(Application, self).__init__(*args, **kwargs)

        os.makedirs(recipes_output_dir, exist_ok=True)

        base_url = base_url or "/"
        cors = aiohttp_cors.setup(self, defaults={
            allow_cors_origin: aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
            )
        })
        cors.add(self.router.add_static(base_url + "recipe", recipes_output_dir, show_index=False))
        cors.add(self.router.add_static(base_url, static_dir))
