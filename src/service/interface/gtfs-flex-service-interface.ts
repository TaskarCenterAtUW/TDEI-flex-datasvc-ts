import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { FlexVersions } from "../../database/entity/flex-version-entity";
import { GtfsFlexDTO } from "../../model/gtfs-flex-dto";
import { FlexQueryParams } from "../../model/gtfs-flex-get-query-params";

export interface IGtfsFlexService {
    /**
     * Gets the GTFS Flex details
     * @param params Query params
     */
    getAllGtfsFlex(params: FlexQueryParams): Promise<GtfsFlexDTO[]>;
    /**
    * 
    * @param id Record Id of the GTFS Flex file to be downloaded
    */
    getGtfsFlexById(id: string): Promise<FileEntity>;
    /**
    * Creates new GTFS Flex in the TDEI system.
    * @param pathwayInfo GTFS Flex object 
    */
    createAGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO>;
}