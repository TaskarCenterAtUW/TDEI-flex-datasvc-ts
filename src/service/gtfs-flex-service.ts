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
import { IGtfsFlexService } from "./interface/gtfs-flex-service-interface";

class GtfsFlexService implements IGtfsFlexService {
    constructor() {
    }

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
            list.push(flex);
        })
        return Promise.resolve(list);
    }

    async getGtfsFlexById(id: string): Promise<FileEntity> {
        const query = {
            text: 'Select file_upload_path from flex_versions WHERE tdei_record_id = $1',
            values: [id],
        }

        let result = await dbClient.query(query);

        if (result.rows.length == 0) throw new HttpException(400, "Record not found");

        const storageClient = Core.getStorageClient();
        if (storageClient == null) throw console.error("Storage not configured");
        let url: string = decodeURIComponent(result.rows[0].file_upload_path);
        return storageClient.getFileFromUrl(url);
    }

    async createAGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO> {
        try {
            flexInfo.file_upload_path = decodeURIComponent(flexInfo.file_upload_path!);

            await dbClient.query(flexInfo.getInsertQuery());

            let pathway = GtfsFlexDTO.from(flexInfo);

            return Promise.resolve(pathway);
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
