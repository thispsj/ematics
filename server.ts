import express from 'https://esm.sh/express'
import {v4 as uidgen} from 'https://esm.sh/uuid'

import * as path from "https://deno.land/std@0.138.0/path/mod.ts";

function getModuleDir(importMeta: ImportMeta): string {
  return path.resolve(path.dirname(path.fromFileUrl(importMeta.url)));
}

const dir = getModuleDir(import.meta);
const app = express()
const port = 3000 || Deno.env.get('PORT')
const kv = await Deno.openKv()

app.use(express.json())

//The server uses the following endpoints as of now:
//GET / - The main page that will display the list of emails, which can be clicked to view analytics.
//GET /:email/open.png - The endpoint that will be used to track when an email is opened.



app.get('/', (req, res) => {
    res.sendFile(dir + '/static/main.html')
    }
)

app.delete('/delete/:email', async (req, res) => {
    //Delete an email
    const email = req.params.email
    const st = await kv.delete(["emails", email])
    // Send empty response
    res.send()
})

app.post('/create', async (req, res) => {
    //Create a new email
    const uuid = uidgen()
    const email = req.body.email
    const st = await kv.set(["emails", uuid], {email: email, open: 0})
    res.send(st);
})

app.get('/list', async (req, res) => {
    //List all emails
    const emails = kv.list<string>({prefix:["emails"]});
    const list = []
    for await ( const r of emails ) list.push(r)
    res.send(list)
})    

app.get('/:email/open.jpg', async (req, res) => {
    //Track when an email is opened
    const email = req.params.email // Mail ID
    let st = await kv.get<Email>(["emails", email])
    st.value.open += 1
    await kv.set(["emails", email], st.value)
    //Send 1x1 pixel image
    res.sendFile(dir + '/static/emailtr.jpg')
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`)
    }
)

// Email object
interface Email {  
    email: string,
    open: number
}