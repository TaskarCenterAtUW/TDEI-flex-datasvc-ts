
import storageService from '../src/service/storage-service'

describe("Storage service test", ()=>{
    describe('Get randomUUID', ()=>{
        test("When requested for randomUUID, expect random UUID", ()=>{
            const uuid = storageService.generateRandomUUID();
            expect(uuid).toBeTruthy();
            expect(uuid).not.toContain('-');
        })
        
    })
    describe('Get folder path', ()=>{
        test('When requested with recordId, expect to receive folder path', ()=>{
            const folderPath = storageService.getFolderPath('tdeiOrgId','recordId');
            console.log(folderPath);
            expect(folderPath).toBeTruthy();
            expect(folderPath).toContain('/');
            expect(folderPath).toContain('tdeiOrgId');
            expect(folderPath).toContain('recordId');
        })
    })
})