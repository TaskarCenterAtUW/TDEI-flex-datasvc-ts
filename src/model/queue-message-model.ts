import { IsNotEmpty } from "class-validator";
import { AbstractDomainEntity, Prop } from "nodets-ms-core/lib/models";
import config from 'config';
import fetch, { Response } from "node-fetch";

const permissionUrl: string = config.get('url.permission');

export class QueueMessageContent extends AbstractDomainEntity {
    @Prop()
    @IsNotEmpty()
    request!: any;
    @Prop("tdei_record_id")
    @IsNotEmpty()
    tdeiRecordId!: string;
    @Prop("user_id")
    @IsNotEmpty()
    userId!: string;
    @IsNotEmpty()
    @Prop("tdei_org_id")
    orgId!: string;
    @Prop()
    @IsNotEmpty()
    stage!: string;
    @Prop()
    @IsNotEmpty()
    response!: {
        success: boolean,
        message: string
    };
    @Prop()
    meta!: any;

    /**
     * To be called by Receiveing Micro-Service to validated the user roles
     * @param roles 
     * @returns 
     */
    async hasPermission(roles: tdeiRoles[]): Promise<boolean> {
        try {
            var url = new URL(permissionUrl);
            let params = new URLSearchParams();
            params.append("userId", this.userId);
            params.append("agencyId", this.orgId);
            params.append("affirmative", "false");
            roles.forEach(x => params.append("roles", x));
            url.search = params.toString();

            const resp: Response = await fetch(url);
            if (!resp.ok) {
                console.error("Error validating the request authorization");
                return false;
            }
            else {
                var satisfied: boolean = await resp.json();
                if (satisfied) {
                    return true;
                }
                else {
                    console.error("Unauthorized request.");
                    return false;
                }
            }
        } catch (error) {
            console.error("Error validating the request authorization : ", error);
            return false;
        }
    }
}