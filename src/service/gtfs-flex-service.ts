import { Geometry, Feature } from "geojson";
import fetch from "node-fetch";
import { Core } from "nodets-ms-core";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { QueryConfig } from "pg";
import { FlexVersions } from "../database/entity/flex-version-entity";
import flexDbClient from "../database/flex-data-source";
import { environment } from "../environment/environment";
import UniqueKeyDbException from "../exceptions/db/database-exceptions";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException } from "../exceptions/http/http-exceptions";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { ServiceDto } from "../model/service-dto";
import { Utility } from "../utility/utility";
import { IGtfsFlexService } from "./interface/gtfs-flex-service-interface";

class GtfsFlexService implements IGtfsFlexService {
    constructor() {
    }

    /**
    * Gets the GTFS Flex details
    * @param params Query params
    */
    async getAllGtfsFlex(params: FlexQueryParams): Promise<GtfsFlexDTO[]> {
        //Builds the query object. All the query consitions can be build in getQueryObject()
        let queryObject = params.getQueryObject();

        let queryConfig = <QueryConfig>{
            text: queryObject.getQuery(),
            values: queryObject.getValues()
        }

        let result = await flexDbClient.query(queryConfig);

        let list: GtfsFlexDTO[] = [];
        result.rows.forEach(x => {

            let flex = GtfsFlexDTO.from(x);
            flex.valid_from = x.valid_from_str;
            flex.valid_to = x.valid_to_str;
            flex.collection_date = x.collection_date_str;
            if (flex.polygon) {
                var polygon = JSON.parse(x.polygon2) as Geometry;
                flex.polygon = {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: polygon,
                            properties: {}
                        } as Feature
                    ]
                }
            }
            list.push(flex);
        })
        return Promise.resolve(list);
    }

    /**
   * 
   * @param id Record Id of the GTFS Flex file to be downloaded
   */
    async getGtfsFlexById(id: string): Promise<FileEntity> {
        const query = {
            text: 'Select file_upload_path from flex_versions WHERE tdei_record_id = $1',
            values: [id],
        }

        let result = await flexDbClient.query(query);

        if (result.rows.length == 0) throw new HttpException(404, "Record not found");

        const storageClient = Core.getStorageClient();
        if (storageClient == null) throw console.error("Storage not configured");
        let url: string = decodeURIComponent(result.rows[0].file_upload_path);
        return storageClient.getFileFromUrl(url);
    }

    /**
    * Creates new GTFS Flex in the TDEI system.
    * @param flexInfo GTFS Flex object 
    */
    async createAGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO> {
        try {
            flexInfo.file_upload_path = decodeURIComponent(flexInfo.file_upload_path!);

            //Validate service_id 
            let service = await this.getServiceById(flexInfo.tdei_service_id, flexInfo.tdei_org_id);
            if (!service) throw new Error("Service id not found or inactive.");

            await flexDbClient.query(flexInfo.getInsertQuery());

            let flex = GtfsFlexDTO.from(flexInfo);
            return Promise.resolve(flex);
        } catch (error) {

            if (error instanceof UniqueKeyDbException) {
                throw new DuplicateException(flexInfo.tdei_record_id);
            }

            console.error("Error saving the flex version", error);
            return Promise.reject(error);
        }

    }

    private async getServiceById(serviceId: string, orgId: string): Promise<ServiceDto> {
        try {
            let secretToken = await Utility.generateSecret();
            const result = await fetch(`${environment.serviceUrl}?service_id=${serviceId}&owner_org=${orgId}&page_no=1&page_size=1`, {
                method: 'get',
                headers: { 'Content-Type': 'application/json', 'x-secret': secretToken }
            });

            const data: [] = await result.json();

            if (result.status != undefined && result.status != 200)
                throw new Error(await result.json());

            if (data.length == 0)
                throw new Error();

            return ServiceDto.from(data.pop());
        } catch (error: any) {
            console.error(error);
            throw new Error("Service id not found or inactive.");
        }
    }
}

const gtfsFlexService: IGtfsFlexService = new GtfsFlexService();
export default gtfsFlexService;
