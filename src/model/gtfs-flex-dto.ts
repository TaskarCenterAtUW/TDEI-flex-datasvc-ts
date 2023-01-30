import { AbstractDomainEntity, Prop } from "nodets-ms-core/lib/models";
import { Polygon } from "./polygon-model";

export class GtfsFlexDTO extends AbstractDomainEntity {
    @Prop()
    tdei_record_id: string = "";
    @Prop()
    tdei_org_id: string = "";
    @Prop()
    tdei_service_id: string = "";
    @Prop()
    collected_by: string = "";
    @Prop()
    collection_date: Date = new Date();
    @Prop()
    collection_method: string = "";
    @Prop()
    valid_from: Date = new Date();
    @Prop()
    valid_to: Date = new Date();
    @Prop()
    data_source: string = "";
    @Prop()
    flex_schema_version: string = "";
    @Prop()
    polygon: Polygon = new Polygon();
}