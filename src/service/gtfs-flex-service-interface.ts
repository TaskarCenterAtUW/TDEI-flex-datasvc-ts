import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { FlexVersions } from "../database/entity/flex-version-entity";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";

export interface IGtfsFlexService {
    getAllGtfsFlex(params: FlexQueryParams): Promise<GtfsFlexDTO[]>;
    getGtfsFlexById(id: string): Promise<FileEntity>;
    createAGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO>;
}