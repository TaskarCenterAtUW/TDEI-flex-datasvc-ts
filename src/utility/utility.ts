import fetch from "node-fetch";
import { environment } from "../environment/environment";
import HttpException from "../exceptions/http/http-base-exception";

export class Utility {

    public static dateIsValid(dateStr: any): boolean {
        const regex = /^\d{4}-\d{2}-\d{2}$/;

        if (dateStr.match(regex) === null) {
            return false;
        }

        const date = new Date(dateStr);

        const timestamp = date.getTime();

        if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
            return false;
        }

        return date.toISOString().startsWith(dateStr);
    }

    public static copy<T extends Object>(target: T, source: any): T {
        Object.keys(target).forEach(key => {
            if (source[key] != undefined) {
                target[key as keyof Object] = source[key];
            }
        }
        );
        return target;
    }

    public static async generateSecret(): Promise<string> {
        let secret = null;
        try {
            const result = await fetch(environment.secretGenerateUrl as string, {
                method: 'get'
            });

            if (result.status != undefined && result.status != 200)
                throw new Error(await result.text());

            const data = await result.text();

            secret = data;
        } catch (error: any) {
            console.error(error);
            throw new HttpException(400, "Failed to generate secret token");
        }
        return secret;
    }
}