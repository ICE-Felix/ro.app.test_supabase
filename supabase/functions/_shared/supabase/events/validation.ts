const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): boolean {
    return typeof value === "string" && UUID_REGEX.test(value);
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validateEventsInsert(
    data: Record<string, unknown>,
): ValidationResult {
    const errors: string[] = [];

    const mustBeStringIfPresent = [
        "title",
        "description",
        "schedule_type",
        "theme",
        "agenda",
        "price",
        "contact_person",
        "phone_no",
        "email",
        "capacity",
        "status",
        "address",
        "location_latitude",
        "location_longitude",
    ];

    for (const key of mustBeStringIfPresent) {
        const v = data[key];
        if (v !== undefined && v !== null && typeof v !== "string") {
            errors.push(`${key} must be a string`);
        }
    }

    if (
        data["event_image_id"] !== undefined &&
        data["event_image_id"] !== null &&
        typeof data["event_image_id"] !== "string"
    ) {
        errors.push("event_image_id must be a valid UUID");
    }

    if (
        data["event_type_id"] !== undefined && data["event_type_id"] !== null &&
        !isValidUuid(data["event_type_id"])
    ) {
        errors.push("event_type_id must be a valid UUID");
    }

    if (
        data["venue_id"] !== undefined && data["venue_id"] !== null &&
        !isValidUuid(data["venue_id"])
    ) {
        errors.push("venue_id must be a valid UUID");
    }

    // Location validation: require either venue_id or location fields
    const hasVenueId = data["venue_id"] !== undefined &&
        data["venue_id"] !== null;
    const hasAddress = data["address"] !== undefined &&
        data["address"] !== null &&
        typeof data["address"] === "string" && data["address"].trim() !== "";
    const hasLatitude = data["location_latitude"] !== undefined &&
        data["location_latitude"] !== null &&
        typeof data["location_latitude"] === "string" &&
        data["location_latitude"].trim() !== "";
    const hasLongitude = data["location_longitude"] !== undefined &&
        data["location_longitude"] !== null &&
        typeof data["location_longitude"] === "string" &&
        data["location_longitude"].trim() !== "";

    const hasLocationFields = hasAddress && hasLatitude && hasLongitude;

    if (!hasVenueId && !hasLocationFields) {
        errors.push(
            "Either venue_id must be provided, or all location fields (address, location_latitude, location_longitude) must be provided",
        );
    }

    return { isValid: errors.length === 0, errors };
}

export function validateEventsUpdate(
    data: Record<string, unknown>,
): ValidationResult {
    const errors: string[] = [];

    if (data["title"] !== undefined) {
        const v = data["title"];
        if (!v || typeof v !== "string" || v.trim() === "") {
            errors.push("title must be a non-empty string");
        }
    }

    if (data["event_type_id"] !== undefined) {
        if (!isValidUuid(data["event_type_id"])) {
            errors.push("event_type_id must be a valid UUID");
        }
    }

    if (data["venue_id"] !== undefined) {
        if (!isValidUuid(data["venue_id"])) {
            errors.push("venue_id must be a valid UUID");
        }
    }

    const optionalStringFields = [
        "description",
        "agenda",
        "theme",
        "schedule_type",
        "price",
        "contact_person",
        "phone_no",
        "email",
        "capacity",
        "status",
        "address",
        "location_latitude",
        "location_longitude",
    ];
    for (const key of optionalStringFields) {
        if (data[key] !== undefined && typeof data[key] !== "string") {
            errors.push(`${key} must be a string`);
        }
    }

    if (
        data["event_image_id"] !== undefined &&
        data["event_image_id"] !== null &&
        typeof data["event_image_id"] !== "string"
    ) {
        errors.push("event_image_id must be a valid UUID");
    }

    return { isValid: errors.length === 0, errors };
}
