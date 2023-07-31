import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { FlexQueryParams } from "../model/gtfs-flex-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsFlexService from "../service/gtfs-flex-service";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException, InputException } from "../exceptions/http/http-exceptions";
import { FlexVersions } from "../database/entity/flex-version-entity";
import { validate, ValidationError } from "class-validator";
import { Version, Versions } from "../model/versions-dto";
import { environment } from "../environment/environment";
import multer, { memoryStorage } from "multer";
import { GtfsFlexDTO } from "../model/gtfs-flex-dto";
import { GtfsFlexUploadMeta } from "../model/gtfs-flex-upload-meta";
import storageService from "../service/storage-service";
import path from "path";
import { Readable } from "stream";
import eventBusService from "../service/event-bus-service";

const upload = multer({
    dest: 'uploads/',
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if(ext != '.zip') {
            cb(new Error('Invalid file type uploaded'));
        }
        cb(null,true);
    },
});

class GtfsFlexController implements IController {
    public path = '/api/v1/gtfs-flex';
    public router = express.Router();
    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get(this.path, this.getAllGtfsFlex);
        this.router.get(`${this.path}/:id`, this.getGtfsFlexById);
        this.router.post(this.path, this.createGtfsFlex);
        this.router.get(`${this.path}/versions/info`, this.getVersions);
    }

    getVersions = async (request: Request, response: express.Response, next: NextFunction) => {
        let versionsList = new Versions([{
            documentation: environment.getewayUrl as string,
            specification: "https://github.com/MobilityData/gtfs-flex",
            version: "v2.0"
        }]);

        response.status(200).send(versionsList);
        this.router.post(this.path,upload.single('file') ,this.createGtfsFlex);
    }

    getAllGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const params: FlexQueryParams = new FlexQueryParams(JSON.parse(JSON.stringify(request.query)));
            const gtfsFlex = await gtfsFlexService.getAllGtfsFlex(params);
            gtfsFlex.forEach(x => {
                x.download_url = `${this.path}/${x.tdei_record_id}`;
            })
            response.status(200).send(gtfsFlex);
        } catch (error) {
            console.error("Error while fetching the flex information", error);
            if (error instanceof InputException) {
                response.status(error.status).send(error.message);
                next(error);
            }
            else {
                response.status(500).send("Error while fetching the flex information");
                next(new HttpException(500, "Error while fetching the flex information"));
            }
        }
    }

    getGtfsFlexById = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const fileEntity: FileEntity = await gtfsFlexService.getGtfsFlexById(request.params.id);

            response.header('Content-Type', fileEntity.mimeType);
            response.header('Content-disposition', `attachment; filename=${fileEntity.fileName}`);
            response.status(200);
            (await fileEntity.getStream()).pipe(response);
        } catch (error) {
            console.error('Error while getting the file stream', error);
            if (error instanceof HttpException) {
                response.status(error.status).send(error.message);
                return next(error);
            }
            response.status(500).send("Error while getting the file stream");
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }
    /**
     * Function to create record in the database and upload the gtfs-files
     * @param request - request 
     * @param response - response
     * @param next 
     * @returns 
     */
    createGtfsFlex = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            // console.log(request.file)
            // console.log(request.body)
            const meta = JSON.parse(request.body['meta']);
            console.log(meta);
            const gtfsdto = GtfsFlexUploadMeta.from(meta);
            console.log(gtfsdto);
            const result = await validate(gtfsdto);
            console.log('result', result);
            console.log(gtfsdto.collection_date);
            const uid = storageService.generateRandomUUID();
            const folderPath = storageService.getFolderPath(gtfsdto.tdei_org_id,uid);
            // storageService.uploadFile()
            const uploadedFile = request.file;
            uploadedFile?.originalname
            const uploadPath = path.join(folderPath,uploadedFile!.originalname)
            console.log(uploadPath);
            // console.log(uploadedFile!.buffer);
            // console.log(uploadedFile);
            await storageService.uploadFile(uploadPath,'application/zip',Readable.from(uploadedFile!.buffer))
            // console.log(meta);
            if (!request.body) {
                response.status(400).send('Input validation failed with below reasons : empty body passed');
                return next(new HttpException(400, 'Input validation failed with below reasons : empty body passed'));
            }
           

            let flex = FlexVersions.from(meta);
            flex.tdei_record_id = uid;
            flex.file_upload_path = uploadPath;
            flex.uploaded_by = gtfsdto.collected_by;//TODO: Get the user.
            // const returnInfo = await gtfsFlexService.createGtfsFlex(flex); 
            console.log(flex);
            
            eventBusService.publishUpload(gtfsdto,uid,uploadPath)
            // Also send the information to the queueu
            
            return response.status(200).send(gtfsdto);

            // return validate(flex).then(async errors => {
            //     // errors is an array of validation errors
            //     if (errors.length > 0) {
            //         console.error('Upload flex file metadata information failed validation. errors: ', errors);
            //         const message = errors.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
            //         response.status(400).send('Input validation failed with below reasons : \n' + message);
            //         next(new HttpException(400, 'Input validation failed with below reasons : \n' + message));
            //     } else {
            //         return await gtfsFlexService.createGtfsFlex(flex)
            //             .then(newFlex => {
            //                 return Promise.resolve(response.status(200).send(newFlex));
            //             })
            //             .catch((error: any) => {
            //                 if (error instanceof DuplicateException) {
            //                     response.status(error.status).send(error.message)
            //                     next(new HttpException(error.status, error.message));
            //                 }
            //                 else {
            //                     response.status(500).send('Error saving the flex version')
            //                     next(new HttpException(500, 'Error saving the flex version'));
            //                 }
            //             });
            //     }
            // });
        } catch (error) {
            console.error('Error saving the flex version', error);
            response.status(500).send('Error saving the flex version')
            // next(new HttpException(500, "Error saving the flex version"));
        }
    }
}

const gtfsFlexController = new GtfsFlexController();
export default gtfsFlexController;