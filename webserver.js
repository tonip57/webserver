import http from "http"
import fs from 'fs'
import {} from 'dotenv/config'
import imageToBase64 from 'image-to-base64'
import download from 'image-downloader'
import axios from 'axios'

const host = '0.0.0.0'
const PORT = 3300
const photoUrl = 'https://picsum.photos/1200'
const volumeUrl = '/usr/src/app/files/'
///const volumeUrl = 'C:/Users/tonip/kube/webserver/files/'

const getCurrentTimestamp = () => {
    const d = new Date()
    let year = d.getFullYear()
    let month = d.getMonth()
    let day = d.getDate()
    const currentTimestamp = day + '.' + month + '.' + year
    return currentTimestamp
}

const checkTimestamp = () => {
    try {
        const timestampInFile = fs.readFileSync(volumeUrl + 'timestamp.txt', 'utf8')
        return timestampInFile
    } catch (err) {
        return null
    }
}

const saveTimestamp = () => {
    const currentTimestamp = getCurrentTimestamp()
    fs.writeFile(volumeUrl + 'timestamp.txt', currentTimestamp, err => {
    if (err) {
        console.error(err)
    }
    return
    })
}

const downloadNewPhoto = () => {
    try {
        download.image({url: photoUrl,dest: volumeUrl + 'image.jpg',})
        .then(({ filename }) => {
            console.log('Saved to', filename)
        })
        .catch((err) => console.error(err))
        saveTimestamp()
    } catch (err) {
        console.error(err)
    }
}

const checkIfPhotoValid = () => {
    if (checkTimestamp() === getCurrentTimestamp()) {
        return true
    } else {
        return false
    }
}


///'http://backend-svc:2345/todos'
///'http://localhost:3301/todos'
function getTodos () {
    return new Promise((resolve) => axios.get('http://backend-svc:2346/todos')
        .then(function (response) {
            console.log(response)
            let stringhtml = ''
            if (response.data["todoList"] !== undefined) {
                response.data["todoList"].forEach(item => {
                    stringhtml = stringhtml + `<li>${item["todo"]} | ${item["done"] === true ? 'Done' : `<button onClick='putTodo(${item["id"]})'>Set Done</button>`}</li>`
                })
            }
            resolve(stringhtml)
        })
            .catch(function (error) {
            console.error(error)
        })
    )
}

function postTodo (todo) {
    axios.post('http://backend-svc:2346/todos/' + todo)
        .then(function (response) {
            console.log(response)
        })
        .catch(function (error) {
            console.log(error)
        }
    )
}

function putTodo (id) {
    axios.put('http://backend-svc:2346/todos/' + id)
        .then(function (response) {
            console.log(response)
        })
        .catch(function (error) {
            console.log(error)
        }
    )
}

const requestListener = function (req, res) {
    if (req.method === 'POST') {
        if (req.url.includes('/todos/')) {
            postTodo(req.url.slice(7))
        } else if (req.url.includes('/postUrl/')) {
            postTodo(`Read: ${req.url.slice(9)}`)
        }
    } else if (req.method === 'PUT' && !req.url.includes('favicon')) {
        if (req.url.includes('/todos/')) {
            putTodo(req.url.slice(7))
        }
    } else if (req.method === 'GET' && !req.url.includes('favicon')) {
        if (req.url.includes('/healthz')) {
            console.log(req.url)
            res.writeHead(200)
            res.end()
        } else {
        console.log(req.url)
        if (checkIfPhotoValid() === false || !fs.existsSync(volumeUrl + 'image.jpg')) {
            console.log("Downloading new photo")
            downloadNewPhoto()
        } else {
            console.log("Using old photo")
        }
        
        try {
            imageToBase64(volumeUrl + "image.jpg")
            .then(
                (response) => {
                    getTodos().then((data) => {
                    res.writeHead(200, {'Content-Type': 'text/html'})
                    res.write(`
                    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
                    <script>function postTodo () {var todo = document.querySelector('input').value; axios.post(window.location.href + 'todos/' + todo).then(function (response) {console.log(response)}).catch(function (error) {console.log(error)}); window.setTimeout(function(){location.reload()},2000);}</script>
                    <script>function putTodo (id) {console.log(window.location.href + 'todos/' + id); axios.put(window.location.href + 'todos/' + id).then(function (response) {console.log(response)}).catch(function (error) {console.log(error)}); window.setTimeout(function(){location.reload()},2000);}</script>
                    <img src="data:image/jpeg;base64,${response}" widht="200px" height="200px"><input maxlength="140"></input><button type="button" onClick='postTodo()'>Create TODO</button><ul>${data}</ul>
                    `)
                    res.end()
                    })
                }
            )
        } catch (err) {
            console.error(err)
        }
        }
    } else {
        res.writeHead(200)
        res.end()
    }
}

const server = http.createServer(requestListener)
server.listen(PORT, host, () => {
    console.log(`Server started in port ${PORT}`)
})

/* node webserver.js */
