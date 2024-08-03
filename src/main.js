import { getShardInfo} from "./shards.js";
import { getRemoteConfig } from "./remote.js";
import { DateTime } from "./luxon.js";
const placeMap = {
    //Map
    'butterfly': "Butterfly Field",
    'brook': 'Forest Brook',
    'rink': 'Ice Rink',
    'temple': 'Broken Temple',
    'starlight': 'Starlight Desert',
    'village': 'Village Islands',
    'boneyard': 'Boneyard',
    'battlefield': 'Battlefield',
    'cave': 'Cave',
    'end': 'Forest Garden',
    'dreams': 'Village of Dreams',
    'graveyard': 'Graveyard',
    'jelly': 'Jellyfish Cove',
    'bird': 'Bird Nest',
    'crab': 'Crabfield',
    'tree': 'Treehouse',
    'island': 'Sanctuary Island',
    'sunny': 'Elevated Clearing',
    'hermit': 'Hermit Valley',
    'ark': 'Forgotten Ark',

    //Realm
    "prairie": "Daylight Prairie",
    'forest': 'Hidden Forest',
    'valley': 'Valley of Triumph',
    'wasteland': 'Golden Wasteland',
    'vault': 'Vault of Knowledge'
}

const memories = ['Jellyfish', 'Crab', 'Manta', 'Krill', 'Whale', 'Elder', 'Not Sure'];

let memoryData = {};


class ShardInterval {
    //type: DateTime local
    constructor(start, end, isRed, occurCode) {
        this.start = start;
        this.end = end;
        this.isRed = isRed;
        this.occurCode = occurCode;//0-5
    }
}

class IntervalList {
    constructor() {
        this.intervals = [];
    }
    add(interval) {
        if (!(interval instanceof ShardInterval)) {
            throw new Error("Trying to add non-ShardInterval to IntervalList");
        }
        this.intervals.push(interval);
        //sort
        this.intervals = this.intervals.sort((a, b) => {
            return a.start - b.start;
        });
        //check for overlap, if so throw error
        for (let i = 0; i < this.intervals.length - 1; i++) {
            if (this.intervals[i].end > this.intervals[i + 1].start) {
                throw new Error("Overlapping intervals");
            }
        }

    }
    get(index) {
        return this.intervals[index];
    }
    remove(index) {
        this.intervals.splice(index, 1);
    }
    update(index, interval) {
        this.intervals[index] = interval;
    }
    merge(intervals) {
        for (let i = 0; i < intervals.length; i++) {
            this.add(intervals.get(i));
        }
    }
    get length() {
        return this.intervals.length;
    }
    get lastEnd() {
        return this.intervals[this.length - 1].end;
    }
    get lastStart() {
        return this.intervals[this.length - 1].start;
    }
    get last() {
        return this.intervals[this.length - 1];
    }
    get first() {
        return this.intervals[0];
    }
    get firstEnd() {
        return this.intervals[0].end;
    }
    get firstStart() {
        return this.intervals[0].start;
    }


}

function main() {
    /***
     * 
     * Config Part
     */
    const input = document.getElementById('input');
    const today = DateTime.local().toISODate();
    let currentDay = today;


    const clockTime = bind('clock-time');
    const prevBtn = bind('prevBtn');
    const nextBtn = bind('nextBtn');
    const location = bind('location');
    const data = bind('data');
    const memory = bind('memory');
    const timeUl = bind('time-ul');
    const titleContainer = bind('title-container');


    function onsubmit() {
        const value = input.value;
        currentDay = value;
        processShards();
    }
    function bind(id) {
        return document.getElementById(id);
    }

    function getFullPlace(shortPlace) {
        let relam = shortPlace.split('.')[0];
        let map = shortPlace.split('.')[1];
        return placeMap[map] + ", " + placeMap[relam];
    }

    function parseTimes(occurrences) {
        let timeStrs = [];
        for (let i = 0; i < 3; i++) {
            let land = occurrences[i].land.toLocal().toFormat("HH:mm:ss");
            land = land + '(' + occurrences[i].land.toLocal().toFormat("EEE") + ')';
            let end = occurrences[i].end.toLocal().toFormat("HH:mm:ss");
            end = end + '(' + occurrences[i].end.toLocal().toFormat("EEE") + ')';

            timeStrs.push(land + " - " + end);
        }
        return timeStrs;

    }

    function calcIntervals(occurrences, localDateTime, isStart, isRed, shardCount) {
        let intervals = new IntervalList();
        if (isStart) {
            for (let i = 2; i > 0; i--) {
                let occur = occurrences[i];
                let end = occur.end.toLocal();
                if (end > localDateTime) {
                    let land = occur.land.toLocal();
                    if (land > localDateTime) {
                        intervals.add(new ShardInterval(land, end, isRed, shardCount * 3 + i));
                    } else {
                        intervals.add(new ShardInterval(localDateTime, end, isRed, shardCount * 3 + i));
                        break;
                    }
                } else {
                    break;
                }
            }
        } else {
            for (let i = 0; i < 3; i++) {
                let occur = occurrences[i];
                let land = occur.land.toLocal();
                if (land < localDateTime) {
                    let end = occur.end.toLocal();
                    if (end < localDateTime) {
                        intervals.add(new ShardInterval(land, end, isRed, shardCount * 3 + i));
                    } else {
                        intervals.add(new ShardInterval(land, localDateTime, isRed, shardCount * 3 + i));
                        break;
                    }
                } else {
                    break;
                }
            }
        }
        return intervals;


    }

    function getAllShards(today) {
        let intervals = new IntervalList();
        let infos = [];
        let dayStart = DateTime.fromISO(today + "T00:00:00").setZone('America/Los_Angeles');
        let dayEnd = DateTime.fromISO(today + "T23:59:59").setZone('America/Los_Angeles');
        //check if they are the same day 
        if (dayStart.toISODate === dayEnd.toISODate()) {
            //only one shard

            let firstShard = getShardInfo(dayStart);
            if (firstShard.hasShard) {
                infos.push(firstShard);
                intervals.merge(calcIntervals(firstShard.occurrences, DateTime.fromISO(today + "T00:00:00").toLocal(), true, firstShard.isRed, 0));
            }
        } else {
            let count =0;
            let firstShard = getShardInfo(dayStart);
            if (firstShard.hasShard) {
                let firstShardEnd = firstShard.lastEnd.toLocal();
                if (firstShardEnd > DateTime.fromISO(today + "T00:00:00").toLocal()) {

                    infos.push(firstShard);
                    intervals.merge(calcIntervals(firstShard.occurrences, DateTime.fromISO(today + "T00:00:00").toLocal(), true, firstShard.isRed, count));
                    count++;
                }
            }

            let secondShard = getShardInfo(dayEnd);
            if (secondShard.hasShard) {
                let secondShardStart = secondShard.occurrences[0].land.toLocal();
                if (secondShardStart < DateTime.fromISO(today + "T23:59:59").toLocal()) {
                    infos.push(secondShard);
                    intervals.merge(calcIntervals(secondShard.occurrences,
                        DateTime.fromISO(today + "T23:59:59").toLocal(), false, secondShard.isRed, count));
                }
            }

        }
        return {
            intervals: intervals,
            infos: infos
        };

    }

    function setTimeline(intervals) {
        timeUl.innerHTML = "";
        for (let i = 0; i < intervals.length; i++) {
            let interval = intervals.get(i);
            let li = document.createElement('li');
            let span = document.createElement('span');
            let title = document.createElement('div');
            title.className = "title";
            title.textContent = parseInt(interval.occurCode / 3 + 1) + "#" + ['First', 'Second', 'Last'][interval.occurCode % 3] + " Shard";
            let time = document.createElement('div');
            time.className = "time";
            let start = document.createElement('span');
            start.textContent = interval.start.toLocal().toFormat("HH:mm:ss");
            let end = document.createElement('span');
            end.textContent = interval.end.toLocal().toFormat("HH:mm:ss");
            time.appendChild(start);
            time.appendChild(end);
            li.appendChild(span);
            li.appendChild(title);
            li.appendChild(time);
            timeUl.appendChild(li);

        }
    }

    function processShards() {
        let today = currentDay;
        let allShards = getAllShards(today);
        let intervals = allShards.intervals;
        let infos = allShards.infos;

        setTimeline(intervals);
        setInfos(infos);
    }

    function setInfos(infos) {
        titleContainer.innerHTML = "";
        for (let i = 0; i < infos.length; i++) {
            let info = infos[i];
            let title = document.createElement('div');
            title.className = "title";
            let typeSpan = document.createElement('span');
            typeSpan.className = "type";
            typeSpan.textContent = (i + 1) + "#" + (info.isRed ? "Red" : "Black");
            typeSpan.style.color = info.isRed ? "red" : "black";
            let iconShard = document.createElement('img');
            iconShard.src = info.isRed ? "./icons/ShardRed.webp" : "./icons/ShardBlack.webp";
            iconShard.className = "icon-shard";
            let rewardSpan = document.createElement('span');
            rewardSpan.textContent = !info.isRed ? "200 Wax" : info.rewardAC + " Asc";
            rewardSpan.className = "reward";
            let iconReward = document.createElement('img');
            iconReward.src = !info.isRed ? "./icons/CandleCake.webp" : "./icons/AscendedCandle.webp";
            iconReward.className = "icon-reward";
            let placeSpan = document.createElement('span');
            placeSpan.className = "place";
            placeSpan.textContent = getFullPlace(info.map);
            title.appendChild(typeSpan);
            title.appendChild(iconShard);
            title.appendChild(rewardSpan);
            title.appendChild(iconReward);
            title.appendChild(placeSpan);
            titleContainer.appendChild(title);
        }
    }


    function parseInfo(shardInfo) {
        let rewardText = shardInfo.isRed ? "Red Shards" : "Black Shards";
        let shardPlace = getFullPlace(shardInfo.map);
        rewardText = rewardText + " in " + shardPlace;
        shardTitle.textContent = rewardText;

        reward.textContent = !shardInfo.isRed ? "200 Wax" : shardInfo.rewardAC + " Ascended Candles";

        //memory todo
        if (shardInfo.isRed) {
            memory.style.display = 'visible';
            memory.textContent = 'Memory: ';
            let memoryCode = 6;
            let skyToday = shardInfo.date.setZone('America/Los_Angeles').toISODate();
            if (memoryData != null && JSON.stringify(memoryData) != JSON.stringify({}) && memoryData != undefined) {
                if (memoryData[skyToday]) {
                    memoryCode = memoryData[skyToday].memory;
                }
                memory.textContent = 'Memory: ' + memories[memoryCode];

            } else {
                getRemoteConfig().then(data => {
                    memoryData = data;
                    if (data[skyToday]) {
                        memoryCode = data[skyToday].memory;
                    }
                }).catch(err => {
                    console.log(err);
                }).finally(() => {
                    memory.textContent = 'Memory: ' + memories[memoryCode];//have to add assignment in both if and else
                });
            }
        } else {
            memory.textContent = '';
            memory.style.display = 'none';
        }





        //times 
        let times = parseTimes(shardInfo.occurrences);
        shard1.textContent = times[0];
        shard2.textContent = times[1];
        shard3.textContent = times[2];

    }

    function updateClock() {
        const now = DateTime.now();
        const formattedTime = now.toFormat("HH:mm:ss");
        clockTime.textContent = formattedTime;
    }

    function handleClick(day) {
        currentDay = day;
        input.value = currentDay;
        processShards();
    }

    /***
     * 
     * Work Part
     */
    input.value = today;
    input.addEventListener('change', onsubmit);
    prevBtn.addEventListener('click', () => {
        handleClick(DateTime.fromISO(currentDay).minus({ days: 1 }).toISODate());
    });
    nextBtn.addEventListener('click', () => {
        handleClick(DateTime.fromISO(currentDay).plus({ days: 1 }).toISODate());
    });
    processShards();

    //clcok
    updateClock();
    setInterval(updateClock, 900);
}

window.addEventListener('load', main);

