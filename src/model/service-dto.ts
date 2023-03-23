import { IsNotEmpty, IsOptional } from "class-validator";
import { FeatureCollection } from "geojson";
import { Prop } from "nodets-ms-core/lib/models";
import { IsValidPolygon } from "../validators/polygon-validator";
import { BaseDto } from "./base-dto";

export class ServiceDto extends BaseDto {
    @Prop()
    service_id: string = "0";
    @IsNotEmpty()
    @Prop()
    owner_org!: string;
    @IsNotEmpty()
    @Prop()
    name!: string;
    @IsOptional()
    @IsValidPolygon()
    @Prop()
    polygon!: FeatureCollection;

    constructor(init?: Partial<ServiceDto>) {
        super();
        Object.assign(this, init);
    }
}
