import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

export class WooShopsWebController extends Controller<Record<string, unknown>> {
    override get(_id?: string, _req?: Request): Promise<Response> {
        return Promise.resolve(
            ResponseService.error(
                "Web interface not supported for woo_shops",
                "WEB_NOT_SUPPORTED",
                405,
                {},
                ResponseType.WEB,
            ),
        );
    }

    override post(
        _data: Record<string, unknown>,
        _req?: Request,
    ): Promise<Response> {
        return Promise.resolve(
            ResponseService.error(
                "Web interface not supported for woo_shops",
                "WEB_NOT_SUPPORTED",
                405,
                {},
                ResponseType.WEB,
            ),
        );
    }

    override put(
        _id: string,
        _data: Record<string, unknown>,
        _req?: Request,
    ): Promise<Response> {
        return Promise.resolve(
            ResponseService.error(
                "Web interface not supported for woo_shops",
                "WEB_NOT_SUPPORTED",
                405,
                {},
                ResponseType.WEB,
            ),
        );
    }

    override delete(_id: string, _req?: Request): Promise<Response> {
        return Promise.resolve(
            ResponseService.error(
                "Web interface not supported for woo_shops",
                "WEB_NOT_SUPPORTED",
                405,
                {},
                ResponseType.WEB,
            ),
        );
    }
}
