/**
 * Middleware to handle the token authorization etc.
 */

import { Request, Response, NextFunction } from 'express';
import jwt  from 'jsonwebtoken';

  

export function tokenValidator(req: Request, res: Response, next: NextFunction): void {
    // Get the authorization key
    const bearerHeader = req.headers.authorization;
    if(bearerHeader === ''|| bearerHeader === undefined){
        res.status(401).send('Unauthorized');
    }
    else {
        // Get the bearer
    const bearer = bearerHeader!.replace(/^Bearer\s/, '');
    if(bearer === '' || bearer === undefined){
        res.status(401).send('Unauthorized');
    }
    // Decode the token
    const jwtOutput = jwt.decode(bearer);
    if(jwtOutput == null){
        res.send(401).send('Invalid token');
    }
    const user_id = jwtOutput?.sub;
    req.body.user_id  = user_id; // Add the user ID to the body
    next();
    }
}