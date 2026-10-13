import pool from '../server/src/config/db.js';
import {createContentHandler} from '../dist-content/public-content-seo.mjs';
export default createContentHandler({query:(sql,params)=>pool.query(sql,params)});
