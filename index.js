import express from "express"
import bodyParser from "body-parser"
import axios from "axios"

const port = 3000;
const app = express();

const API_URL = "https://api.ip2location.io";
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs")
})

function getTimeFromOffset(offsetStr) {
    const match = offsetStr.match(/([+-])(\d{1,2}):(\d{2})/);
    if (!match) throw new Error("Invalid offset format");

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const totalOffsetMs = sign * (hours * 60 + minutes) * 60000;

    const nowUtc = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);

    const timeAtOffset = new Date(nowUtc.getTime() + totalOffsetMs);
    return timeAtOffset.toString().split(' GMT')[0];
}

app.post("/", async (req, res) => {
    try {
        const response = await axios.get(API_URL, {
            params: {
                key: process.env.API_KEY,
                ip: req.body.ip,
            }
        })
        console.log(response);
        const data = {
            country: response.data.country_name,
            state: response.data.region_name,
            time: getTimeFromOffset(response.data.time_zone),
            proxy: response.data.is_proxy,
            latitude: response.data.latitude,
            longitude: response.data.longitude
        };
        for (let key in data) {
            if (data[key] === true) data[key] = "Yes";
            else if (data[key] === false) data[key] = "No";
        }

        const fields = [
            { key: 'country', label: 'Country' },
            { key: 'state', label: 'State' },
            { key: 'time', label: 'Time' },
            { key: 'proxy', label: 'Proxy' },
            { key: 'latitude', label: 'Latitude' },
            { key: 'longitude', label: 'Longitude' }
        ];
        res.render("index.ejs", { data, fields })
    } catch (error) {
        console.log("Error: ", error.message);
    }
})

app.listen(port, () => {
    console.log("Server running on port " + port);
});