class Duration {
    constructor(hour, minute = 0, second = 0) {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
    }

}

class ShardConfig {
    constructor(noShardWkDay, interval, offset, maps, ascCount = 0) {
        this.noShardWkDay = noShardWkDay;
        this.offset = offset; //Duration
        this.interval = interval;//Duration
        this.maps = maps;
        this.ascCount = ascCount;
    }
}



const landOffset = new Duration(0, 8, 40); //after start
const endOffset = new Duration(4); //after start

const blackShardInterval = new Duration(8);
const redShardInterval = new Duration(6);

const realms = ['prairie', 'forest', 'valley', 'wasteland', 'vault']

const shardsInfo = [
    new ShardConfig(
        [6, 7],
        blackShardInterval,
        new Duration(1, 50),
        ['prairie.butterfly', 'forest.brook', 'valley.rink', 'wasteland.temple', 'vault.starlight']
    ),
    new ShardConfig(
        [7, 1],
        blackShardInterval,
        new Duration(2, 10),
        ['prairie.village', 'forest.boneyard', 'valley.rink', 'wasteland.battlefield', 'vault.starlight']
    ),
    new ShardConfig(
        [1, 2],
        redShardInterval,
        new Duration(7, 40),
        ['prairie.cave', 'forest.end', 'valley.dreams', 'wasteland.graveyard', 'vault.jelly'],
        2
    ),
    new ShardConfig(
        [2, 3],
        redShardInterval,
        new Duration(2, 20),
        ['prairie.bird', 'forest.tree', 'valley.dreams', 'wasteland.crab', 'vault.jelly'],
        2.5
    ),
    new ShardConfig(
        [3, 4],
        redShardInterval,
        new Duration(3, 30),
        ['prairie.island', 'forest.sunny', 'valley.hermit', 'wasteland.ark', 'vault.jelly'],
        3.5
    )
]

const overrideAsc = {
    // 'Forest Garden': 2.5,
    'forest.end': 2.5,
    // 'Village of Dreams': 2.5,
    'valley.dreams': 2.5,
    // 'Treehouse': 3.5,
    'forest.tree': 3.5,
    // 'Jellyfish Cove': 3.5,
    'vault.jelly': 3.5
}

// Used to validate variation input, not listed = 1
const numMapVarients = {
    'prairie.butterfly': 3,
    'prairie.village': 3,
    'prairie.bird': 2,
    'prairie.island': 3,
    'forest.brook': 2,
    'forest.end': 2,
    'valley.rink': 3,
    'valley.dreams': 2,
    'wasteland.temple': 3,
    'wasteland.battlefield': 3,
    'wasteland.graveyard': 2,
    'wasteland.crab': 2,
    'wasteland.ark': 4,
    'vault.starlight': 3,
    'vault.jelly': 2,
};

export function getShardInfo(date, override = null) {
    const today = date.setZone('America/Los_Angeles').startOf('day');
    const [dayOfMth, dayOfWk] = [today.day, today.weekday];
    const isRed = override?.isRed ?? dayOfMth % 2 === 1;
    const realmIdx = override?.realm ?? (dayOfMth - 1) % 5;
    const infoIndex = override?.group ?? (dayOfMth % 2 === 1 ? (((dayOfMth - 1) / 2) % 3) + 2 : (dayOfMth / 2) % 2);
    const { noShardWkDay, interval, offset, maps, ascCount } = shardsInfo[infoIndex];
    const hasShard = override?.hasShard ?? !noShardWkDay.includes(dayOfWk);
    const map = override?.map ?? maps[realmIdx];
    const rewardAC = isRed ? overrideAsc[map] ?? ascCount : 0;
    const numVarient = numMapVarients[map] ?? 1;
    let firstStart = today.plus({
        hours: offset.hour,
        minutes: offset.minute,
        seconds: offset.second
    });

    //Detect timezone changed, happens on Sunday, shardInfoIdx is 2,3 or 4. Offset > 2 hours
    if (dayOfWk === 7 && today.isInDST !== firstStart.isInDST) {
        firstStart = firstStart.plus({ hours: firstStart.isInDST ? -1 : 1 });
    }

    const occurrences = Array.from({ length: 3 }, (_, i) => {
        const start = firstStart.plus({
            hours: interval.hour * i,
            minutes: interval.minute * i,
            seconds: interval.second * i
        });
        const land = start.plus({
            hours: landOffset.hour,
            minutes: landOffset.minute,
            seconds: landOffset.second
        });
        const end = start.plus({
            hours: endOffset.hour,
            minutes: endOffset.minute,
            seconds: endOffset.second
        });
        return { start, land, end };
    });
    return {
        date,
        isRed,
        hasShard,
        offset,
        interval,
        lastEnd: occurrences[2].end,
        realm: realms[realmIdx],
        map,
        numVarient,
        rewardAC,
        occurrences,
        wasOverride: !!override,
    };
}


