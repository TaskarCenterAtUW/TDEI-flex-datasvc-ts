import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { FlexVersions } from "../../database/entity/flex-version-entity";
import { GtfsFlexDTO } from "../../model/gtfs-flex-dto";
import { FlexQueryParams } from "../../model/gtfs-flex-get-query-params";
import { ServiceDto } from "../../model/service-dto";

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
    * @param flexInfo GTFS Flex object
    */
    createGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO>;

    /**
     * Gets the service details for given projectGroupId and serviceid
     * @param serviceId service id uniquely represented by TDEI system
     * @param projectGroupId oraganization id uniquely represented by TDEI system
     * @returns 
     */
    getServiceById(serviceId: string, projectGroupId: string): Promise<ServiceDto>;
}