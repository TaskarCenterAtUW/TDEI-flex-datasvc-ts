// Test for upload metadata
import { validate } from "class-validator";
import { GtfsFlexUploadMeta } from "../src/model/gtfs-flex-upload-meta";
describe('GTFS Flex Upload metadata test', ()=>{
    describe('Unit tests', ()=>{

        test('When supplied without collected by, meta validation should fail', async ()=>{
            const meta = `{
                "tdei_org_id":"5e339544-3b12-40a5-8acd-78c66d1fa981",
                "tdei_service_id":"333",
                "collected_by":"",
                "collection_date":"2023-03-02T04:22:42.493Z",
                "collection_method":"manual",
                "valid_from":"2023-03-02T04:22:42.493Z",
                "valid_to":"2023-03-02T04:22:42.493Z",
                "data_source":"TDEITools",
                "polygon":{
                    "type":"FeatureCollection",
                    "features":[
                        {
                            "type":"Feature",
                            "properties":{},
                            "geometry":{
                                "coordinates":[
                                    [[-122.16214567229673,47.674335369752754],[-122.16214567229673,47.66421552524781],[-122.14711788984943,47.66421552524781],[-122.14711788984943,47.674335369752754],[-122.16214567229673,47.674335369752754]]],
                                    "type":"Polygon"
                                }
                            }]},
                "flex_schema_version":"v2.0"}`
              
            const gtfsdto = GtfsFlexUploadMeta.from(JSON.parse(meta));
           await expect(validate(gtfsdto)).resolves.toHaveLength(1);
        })
    })
})