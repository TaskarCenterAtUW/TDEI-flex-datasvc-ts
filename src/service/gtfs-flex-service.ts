import { Core } from "nodets-ms-core";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { Equal, FindOptionsWhere, Raw } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { FlexVersions } from "../database/entity/flex-version-entity";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { Utility } from "../utility/utility";
import { IGtfsFlexService } from "./gtfs-flex-service-interface";

class GtfsFlexService implements IGtfsFlexService {
    constructor() {
    }

    async getAllGtfsFlex(params: FlexQueryParams): Promise<GtfsFlexDTO[]> {
        // get a gtfsFlex repository to perform operations with gtfsFlex
        const gtfsFlexRepository = AppDataSource.getRepository(FlexVersions);

        //Set defaults if not provided
        if (params.page_no == undefined) params.page_no = 1;
        if (params.page_size == undefined) params.page_size = 10;
        let skip = params.page_no == 1 ? 0 : (params.page_no - 1) * params.page_size;
        let take = params.page_size > 50 ? 50 : params.page_size;

        let where: FindOptionsWhere<FlexVersions> = {};

        if (params.flex_schema_version) where.flex_schema_version = Equal(params.flex_schema_version);
        if (params.tdei_org_id) where.tdei_org_id = Equal(params.tdei_org_id);
        if (params.tdei_record_id) where.tdei_record_id = Equal(params.tdei_record_id);
        if (params.tdei_service_id) where.tdei_service_id = Equal(params.tdei_service_id);
        if (params.date_time && Utility.dateIsValid(params.date_time)) where.valid_to = Raw((alias) => `${alias} > :date`, { date: params.date_time });

        // load a gtfsFlex by a given gtfsFlex id.
        const gtfsFlex = await gtfsFlexRepository.find({
            where: where,
            order: {
                tdei_record_id: "DESC",
            },
            skip: skip,
            take: take,
        });

        let list: GtfsFlexDTO[] = [];
        gtfsFlex.forEach(x => {

            let flex: GtfsFlexDTO = Utility.copy<GtfsFlexDTO>(new GtfsFlexDTO(), x);;
            list.push(flex);
        })
        return Promise.resolve(list);
    }

    async getGtfsFlexById(id: string): Promise<FileEntity> {
        // get a gtfsFlex repository to perform operations with gtfsFlex
        const gtfsFlexRepository = AppDataSource.getRepository(FlexVersions);

        // load a gtfsFlex by a given gtfsFlex id
        const gtfsFlex: FlexVersions | any = await gtfsFlexRepository.findOneBy(
            {
                tdei_record_id: id
            });

        const storageClient = Core.getStorageClient();
        if (storageClient == null) throw console.error("Storage not configured");
        let url: string = decodeURIComponent(gtfsFlex?.file_upload_path);
        return storageClient.getFileFromUrl(url);
    }

    async createAGtfsFlex(flexInfo: FlexVersions): Promise<GtfsFlexDTO> {
        try {
            // get a gtfsFlex repository to perform operations with gtfsFlex
            const gtfsFlexRepository = AppDataSource.getRepository(FlexVersions);
            flexInfo.file_upload_path = decodeURIComponent(flexInfo.file_upload_path!);
            // create a real gtfsFlex object from gtfsFlex json object sent over http
            const newGtfsFlex = gtfsFlexRepository.create(flexInfo);

            // save received gtfsFlex
            await gtfsFlexRepository.save(newGtfsFlex);
            let flex: GtfsFlexDTO = Utility.copy<GtfsFlexDTO>(new GtfsFlexDTO(), newGtfsFlex);

            return Promise.resolve(flex);
        } catch (error) {
            console.log("Error saving the flex version", error);
            return Promise.reject(error);
        }

    }
}

const gtfsFlexService = new GtfsFlexService();
export default gtfsFlexService;
