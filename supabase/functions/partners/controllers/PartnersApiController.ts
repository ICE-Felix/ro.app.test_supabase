import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { WooShops } from "../../_shared/woo_commerce/shops/wooShops.ts";

export class PartnersApiController extends Controller {
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    isValidPhone(phone) {
        return /^\+?[0-9]{10,15}$/.test(phone);
    }
    buildWooShopPayload(data) {
        return {
            name: data.company_name?.trim(),
            identification_number: (data.registration_number?.trim() || data.tax_id?.trim()) ?? undefined,
            phone: data.phone_number?.trim() || undefined,
            email: data.business_email?.trim() || data.orders_email?.trim() || undefined,
            address: data.address?.trim() || undefined
        };
    }

    validatePartnersData(data) {
        const errors = [];
        if (!data.company_name || typeof data.company_name !== "string" || data.company_name.trim() === "") {
            errors.push("company_name is required and must be a non-empty string");
        }
        if (!data.tax_id || typeof data.tax_id !== "string" || data.tax_id.trim() === "") {
            errors.push("tax_id is required and must be a non-empty string");
        }
        if (data.registration_number && typeof data.registration_number === "string" && data.registration_number.trim() === "") {
            errors.push("registration_number must be a non-empty string if provided");
        }
        if (data.address && typeof data.address === "string" && data.address.trim() === "") {
            errors.push("address must be a non-empty string if provided");
        }
        if (data.bank_account && typeof data.bank_account === "string" && data.bank_account.trim() === "") {
            errors.push("bank_account must be a non-empty string if provided");
        }
        if (data.bank_name && typeof data.bank_name === "string" && data.bank_name.trim() === "") {
            errors.push("bank_name must be a non-empty string if provided");
        }
        if (data.administrator_contact_id && typeof data.administrator_contact_id === "string") {
            if (!this.isValidUUID(data.administrator_contact_id)) {
                errors.push("administrator_contact_id must be a valid UUID");
            }
        }
        if (data.is_active !== undefined) {
            if (typeof data.is_active !== "boolean" && typeof data.is_active !== "string" && typeof data.is_active !== "number") {
                errors.push("is_active must be a boolean, string ('1'/'0'), or number (1/0)");
            } else if (typeof data.is_active === "string" && data.is_active !== "1" && data.is_active !== "0") {
                errors.push("is_active string value must be '1' or '0'");
            } else if (typeof data.is_active === "number" && data.is_active !== 1 && data.is_active !== 0) {
                errors.push("is_active number value must be 1 or 0");
            }
        }
        if (data.business_email && typeof data.business_email === "string" && data.business_email.trim() !== "") {
            if (!this.isValidEmail(data.business_email.trim())) {
                errors.push("business_email must be a valid email address");
            }
        }
        if (data.orders_email && typeof data.orders_email === "string" && data.orders_email.trim() !== "") {
            if (!this.isValidEmail(data.orders_email.trim())) {
                errors.push("orders_email must be a valid email address");
            }
        }
        // Phone
        if (data.phone_number !== undefined && data.phone_number !== null) {
            if (typeof data.phone_number === "string" && data.phone_number.trim() !== "") {
                if (!this.isValidPhone(data.phone_number.trim())) {
                    errors.push("phone_number must be a valid international phone (e.g., +40712345678)");
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validatePartnersDataForUpdate(data) {
        const errors = [];
        if (data.company_name !== undefined) {
            if (!data.company_name || typeof data.company_name !== "string" || data.company_name.trim() === "") {
                errors.push("company_name must be a non-empty string");
            }
        }
        if (data.tax_id !== undefined) {
            if (!data.tax_id || typeof data.tax_id !== "string" || data.tax_id.trim() === "") {
                errors.push("tax_id must be a non-empty string");
            }
        }
        if (data.registration_number !== undefined && data.registration_number !== null) {
            if (typeof data.registration_number === "string" && data.registration_number.trim() === "") {
                errors.push("registration_number must be a non-empty string if provided");
            }
        }
        if (data.address !== undefined && data.address !== null) {
            if (typeof data.address === "string" && data.address.trim() === "") {
                errors.push("address must be a non-empty string if provided");
            }
        }
        if (data.bank_account !== undefined && data.bank_account !== null) {
            if (typeof data.bank_account === "string" && data.bank_account.trim() === "") {
                errors.push("bank_account must be a non-empty string if provided");
            }
        }
        if (data.bank_name !== undefined && data.bank_name !== null) {
            if (typeof data.bank_name === "string" && data.bank_name.trim() === "") {
                errors.push("bank_name must be a non-empty string if provided");
            }
        }
        if (data.administrator_contact_id !== undefined && data.administrator_contact_id !== null) {
            if (typeof data.administrator_contact_id === "string" && !this.isValidUUID(data.administrator_contact_id)) {
                errors.push("administrator_contact_id must be a valid UUID");
            }
        }
        if (data.is_active !== undefined) {
            if (typeof data.is_active !== "boolean" && typeof data.is_active !== "string" && typeof data.is_active !== "number") {
                errors.push("is_active must be a boolean, string ('1'/'0'), or number (1/0)");
            } else if (typeof data.is_active === "string" && data.is_active !== "1" && data.is_active !== "0") {
                errors.push("is_active string value must be '1' or '0'");
            } else if (typeof data.is_active === "number" && data.is_active !== 1 && data.is_active !== 0) {
                errors.push("is_active number value must be 1 or 0");
            }
        }
        if (data.business_email !== undefined && data.business_email !== null) {
            if (typeof data.business_email === "string" && data.business_email.trim() !== "") {
                if (!this.isValidEmail(data.business_email.trim())) {
                    errors.push("business_email must be a valid email address");
                }
            }
        }
        if (data.orders_email !== undefined && data.orders_email !== null) {
            if (typeof data.orders_email === "string" && data.orders_email.trim() !== "") {
                if (!this.isValidEmail(data.orders_email.trim())) {
                    errors.push("orders_email must be a valid email address");
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    addAdministratorName(partner) {
        if (partner.administrator_contact && partner.administrator_contact.first_name && partner.administrator_contact.last_name) {
            partner.administrator_name = `${partner.administrator_contact.first_name} ${partner.administrator_contact.last_name}`;
        }
        return partner;
    }
    convertIsActiveToBoolean(value) {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") return value === "1";
        if (typeof value === "number") return value === 1;
        return false;
    }

    async get(id, _req) {
        this.logAction("PartnersAPI GET", {
            id
        });
        const { client } = await AuthenticationService.authenticate(_req);
        this.logAction(typeof client);
        if (id) {
            console.log(`API: Fetching partner with id: ${id}`);
            return client.from("partners").select(`
          *,
          administrator_contact:administrator_contact_id(
            id,
            first_name,
            last_name,
            phone_no,
            email
          )
        `).eq("id", id).is("deleted_at", null).single().then(({ data, error })=>{
                if (error) {
                    return ResponseService.error("Error fetching partner", error.code, 400, error, ResponseType.API);
                }
                const partnerWithName = this.addAdministratorName(data);
                return ResponseService.success(partnerWithName, 200, undefined, ResponseType.API);
            });
        }
        console.log("API: Fetching all partners");
        return client.from("partners").select(`
        *,
        administrator_contact:administrator_contact_id(
          id,
          first_name,
          last_name,
          phone_no,
          email
        )
      `).is("deleted_at", null).order("created_at", {
            ascending: false
        }).then(({ data, error })=>{
            if (error) {
                return ResponseService.error("Error fetching partners", error.code, 400, error, ResponseType.API);
            }
            const partnersWithNames = data?.map((partner)=>this.addAdministratorName(partner));
            return ResponseService.success(partnersWithNames, 200, undefined, ResponseType.API);
        });
    }
    async post(data, _req) {
        this.logAction("PartnersAPI POST", {
            data
        });
        const validation = this.validatePartnersData(data);
        if (!validation.isValid) {
            return ResponseService.error("Validation failed", "VALIDATION_ERROR", 400, {
                errors: validation.errors
            }, ResponseType.API);
        }
        const { client } = await AuthenticationService.authenticate(_req);
        const partnerData = {
            company_name: data.company_name.trim(),
            tax_id: data.tax_id.trim(),
            registration_number: data.registration_number?.trim() || null,
            address: data.address?.trim() || null,
            bank_account: data.bank_account?.trim() || null,
            bank_name: data.bank_name?.trim() || null,
            administrator_contact_id: data.administrator_contact_id || null,
            is_active: data.is_active !== undefined ? this.convertIsActiveToBoolean(data.is_active) : true,
            business_email: data.business_email?.trim() || null,
            orders_email: data.orders_email?.trim() || null,
            phone_number: data.phone_number?.trim() || null
        };
        let wooShopId;
        try {
            const wooShop = await WooShops.create(this.buildWooShopPayload(data));
            const id = wooShop?.id ?? wooShop?.shop_id ?? wooShop?.ID;
            if (id == null) throw new Error("Woo shop creation did not return an id");
            const idNum = Number(id);
            if (!Number.isFinite(idNum)) throw new Error("Woo shop id is not numeric as expected");
            wooShopId = idNum;
        } catch (error) {
            return ResponseService.error("Failed to create Woo shop", "WOO_SHOPS_CREATE_ERROR", 502, {
                error: error instanceof Error ? error.message : String(error)
            }, ResponseType.API);
        }
        let createdPartner;
        {
            const { data: pData, error: pErr } = await client.from("partners").insert(partnerData).select(`
        *,
        administrator_contact:administrator_contact_id(
          id, first_name, last_name, phone_no, email
        )
      `).single();
            if (pErr) {
                return ResponseService.error("Error creating partner", "PARTNER_CREATE_ERROR", 400, pErr, ResponseType.API);
            }
            createdPartner = pData;
        }
        {
            const { error: linkErr } = await client.from("shops").insert({
                partner_id: createdPartner.id,
                woo_shop_id: wooShopId
            }).select("*").single();
            if (linkErr) {
                return ResponseService.error("Error creating shop record", "SHOP_LINK_CREATE_ERROR", 400, linkErr, ResponseType.API);
            }
        }
        const partnerWithName = this.addAdministratorName(createdPartner);
        return ResponseService.created({
            partner: partnerWithName,
            woo_shop_id: wooShopId
        }, partnerWithName.id, ResponseType.API);
    }
    async put(id, data, _req) {
        this.logAction("PartnersAPI PUT", { id, data });

        const validation = this.validatePartnersDataForUpdate(data);
        if (!validation.isValid) {
            return ResponseService.error(
                "Validation failed",
                "VALIDATION_ERROR",
                400,
                { errors: validation.errors },
                ResponseType.API
            );
        }

        const { client } = await AuthenticationService.authenticate(_req);

        const partnerData = { updated_at: new Date().toISOString() };
        if (data.company_name !== undefined) partnerData.company_name = data.company_name.trim();
        if (data.tax_id !== undefined) partnerData.tax_id = data.tax_id.trim();
        if (data.registration_number !== undefined) partnerData.registration_number = data.registration_number?.trim() || null;
        if (data.address !== undefined) partnerData.address = data.address?.trim() || null;
        if (data.bank_account !== undefined) partnerData.bank_account = data.bank_account?.trim() || null;
        if (data.bank_name !== undefined) partnerData.bank_name = data.bank_name?.trim() || null;
        if (data.administrator_contact_id !== undefined) partnerData.administrator_contact_id = data.administrator_contact_id || null;
        if (data.is_active !== undefined) partnerData.is_active = this.convertIsActiveToBoolean(data.is_active);
        if (data.business_email !== undefined) partnerData.business_email = data.business_email?.trim() || null;
        if (data.orders_email !== undefined) partnerData.orders_email = data.orders_email?.trim() || null;
        if (data.phone_number !== undefined) partnerData.phone_number = data.phone_number?.trim() || null;

        const { data: updatedPartner, error: updErr } = await client
            .from("partners")
            .update(partnerData)
            .eq("id", id)
            .is("deleted_at", null)
            .select(`
      *,
      administrator_contact:administrator_contact_id(
        id, first_name, last_name, phone_no, email
      )
    `)
            .single();

        if (updErr) {
            return ResponseService.error(
                "Error updating partner",
                updErr.code,
                400,
                updErr,
                ResponseType.API
            );
        }

        let warning = null;

        const { data: linkRows } = await client
            .from("shops")
            .select("id, woo_shop_id")
            .eq("partner_id", id)
            .limit(1);

        const link = Array.isArray(linkRows) && linkRows.length ? linkRows[0] : null;

        if (link && link.woo_shop_id != null) {
            try {
                await WooShops.update(link.woo_shop_id, this.buildWooShopPayload(updatedPartner));
            } catch (e) {
                warning = {
                    code: "WOO_SHOP_UPDATE_ERROR",
                    message: "Partner updated, but Woo shop update failed.",
                    detail: e instanceof Error ? e.message : String(e),
                };
            }
        } else {
            let wooShopId;
            try {
                const created = await WooShops.create(this.buildWooShopPayload(updatedPartner));
                const rawId = created?.id ?? created?.shop_id ?? created?.ID ?? created?.term_id;
                if (rawId == null) throw new Error("Woo shop creation did not return an id");
                const idNum = Number(rawId);
                if (!Number.isFinite(idNum)) throw new Error("Woo shop id is not numeric as expected");
                wooShopId = idNum;
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (/term with the name provided already exists/i.test(msg) || /already exists/i.test(msg)) {
                    try {
                        const q = (updatedPartner.company_name || "").toString().trim();
                        const results = await WooShops.search(q, { per_page: 50 });
                        const list = Array.isArray(results) ? results : (results ? [results] : []);
                        const needle = q.toLowerCase();
                        const match = list.find((r) => ((r?.name || r?.title || "") + "")
                            .trim()
                            .toLowerCase() === needle);
                        const rawId = match?.id ?? match?.shop_id ?? match?.ID ?? match?.term_id;
                        const idNum = Number(rawId);
                        if (!Number.isFinite(idNum)) throw new Error("Existing Woo shop found but id missing/non-numeric");
                        wooShopId = idNum;
                    } catch (findErr) {
                        warning = {
                            code: "WOO_SHOP_CREATE_OR_FIND_ERROR",
                            message: "Partner updated, but could not create or resolve Woo shop.",
                            detail: findErr instanceof Error ? findErr.message : String(findErr),
                        };
                    }
                } else {
                    warning = {
                        code: "WOO_SHOP_CREATE_ERROR",
                        message: "Partner updated, but Woo shop creation failed.",
                        detail: msg,
                    };
                }
            }

            if (wooShopId != null) {
                const { error: linkErr } = await client
                    .from("shops")
                    .insert({ partner_id: id, woo_shop_id: wooShopId })
                    .select("*")
                    .single();
                if (linkErr) {
                    warning = {
                        code: "SHOP_LINK_CREATE_ERROR",
                        message: "Partner updated, but linking to Woo shop failed.",
                        detail: linkErr,
                    };
                }
            }
        }

        const payload = this.addAdministratorName(updatedPartner);
        if (warning) payload._warning = warning;

        return ResponseService.success(payload, 200, undefined, ResponseType.API);
    }
    async delete(id, _req) {
        this.logAction("PartnersAPI DELETE", { id });

        const { client } = await AuthenticationService.authenticate(_req);


        const { data: deletedRow, error } = await client
            .from("partners")
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .is("deleted_at", null)
            .select("id")
            .single();

        if (error) {
            return ResponseService.error(
                "Error deleting partner",
                error.code,
                400,
                error,
                ResponseType.API
            );
        }

        const now = new Date().toISOString();
        let warning = null;

        const { data: links } = await client
            .from("shops")
            .select("id, woo_shop_id")
            .eq("partner_id", id)
            .is("deleted_at", null);

        if (Array.isArray(links) && links.length) {
            for (const l of links) {
                if (l.woo_shop_id != null) {
                    try {
                        await WooShops.delete(l.woo_shop_id, true);
                    } catch (e) {
                        warning = {
                            code: "WOO_SHOP_DELETE_ERROR",
                            message:
                                "Partner deleted, but deleting Woo shop failed for at least one link.",
                            detail: e instanceof Error ? e.message : String(e),
                        };
                    }
                }
            }

            const { error: updErr } = await client
                .from("shops")
                .update({ deleted_at: now, updated_at: now })
                .eq("partner_id", id)
                .is("deleted_at", null);

            if (updErr) {
                warning = {
                    code: "SHOP_LINK_SOFT_DELETE_ERROR",
                    message: "Partner deleted, but marking shop link(s) as deleted failed.",
                    detail: updErr,
                };
            }
        }

        const data = { deleted: true, id: deletedRow.id };
        if (warning) data._warning = warning;

        return ResponseService.success(data, 200, undefined, ResponseType.API);
    }
}
