import { Core } from "nodets-ms-core";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { QueryConfig } from "pg";
import dbClient from "../database/data-source";
import { FlexVersions } from "../database/entity/flex-version-entity";
import UniqueKeyDbException from "../exceptions/db/database-exceptions";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException } from "../exceptions/http/http-exceptions";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { PolygonDto } from "../model/polygon-model";
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

        let result = await dbClient.query(queryConfig);

        let list: GtfsFlexDTO[] = [];
        result.rows.forEach(x => {

            let flex = GtfsFlexDTO.from(x);
            if (flex.polygon)
                flex.polygon = new PolygonDto({ coordinates: JSON.parse(x.polygon2).coordinates });
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

        let result = await dbClient.query(query);

        if (result.rows.length == 0) throw new HttpException(404, "Record not found");

        const storageClient = Core.getStorageClient();
        if (storageClient == null) throw console.error("Storage not configured");
        let url: string = decodeURIComponent(result.rows[0].file_upload_path);
        return storageClient.getFileFromUrl(url);
    }

    /**
    * Creates new GTFS Flex in the TDEI system.
    * @param pathwayInfo GTFS Flex object 
    */
    async createAGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO> {
        try {
            flexInfo.file_upload_path = decodeURIComponent(flexInfo.file_upload_path!);

            await dbClient.query(flexInfo.getInsertQuery());

            let flex = GtfsFlexDTO.from(flexInfo);
            return Promise.resolve(flex);
        } catch (error) {

            if (error instanceof UniqueKeyDbException) {
                throw new DuplicateException(flexInfo.tdei_record_id);
            }

            console.log("Error saving the flex version", error);
            return Promise.reject(error);
        }

    }
}

const gtfsFlexService: IGtfsFlexService = new GtfsFlexService();
export default gtfsFlexService;
