const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tsubaki_chains.db');
const db = new sqlite3.Database(dbPath);

// 체인 테이블 생성
db.serialize(() => {
    // 체인 테이블
    db.run(`CREATE TABLE IF NOT EXISTS chains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_number TEXT NOT NULL,
        chain_size TEXT NOT NULL,
        series TEXT NOT NULL,
        strands INTEGER NOT NULL,
        pin_type TEXT NOT NULL,
        pitch REAL,
        tensile_strength REAL,
        allowable_load REAL,
        weight REAL,
        material TEXT DEFAULT 'Steel',
        pdf_catalog TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 스프로켓 테이블
    db.run(`CREATE TABLE IF NOT EXISTS sprockets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_number TEXT NOT NULL,
        chain_size TEXT NOT NULL,
        teeth_count INTEGER NOT NULL,
        hub_type TEXT NOT NULL,
        bore_type TEXT NOT NULL,
        pilot_bore REAL,
        max_bore REAL,
        hub_diameter REAL,
        hub_length REAL,
        outer_diameter REAL,
        pitch_diameter REAL,
        weight REAL,
        material TEXT DEFAULT 'Steel',
        tooth_hardening BOOLEAN DEFAULT 0,
        pdf_catalog TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 초기 데이터 삽입 (중복 체크)
    db.get("SELECT COUNT(*) as count FROM chains", (err, row) => {
        if (!err && row.count === 0) {
            const chainStmt = db.prepare(`INSERT INTO chains 
                (model_number, chain_size, series, strands, pin_type, pitch, tensile_strength, allowable_load, weight, material, pdf_catalog) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            // 샘플 체인 데이터
            const sampleChains = [
                ['RS25-1-RP', 'RS25', 'RS', 1, 'RP', 6.35, 4.12, 0.64, 0.14, 'Steel', 'catalog/rs25-catalog.pdf'],
                ['RS35-1-RP', 'RS35', 'RS', 1, 'RP', 9.525, 8.9, 1.42, 0.27, 'Steel', 'catalog/rs35-catalog.pdf'],
                ['RS40-2-RP', 'RS40', 'RS', 2, 'RP', 12.7, 14.1, 2.27, 0.54, 'Steel', 'catalog/rs40-catalog.pdf'],
                ['RS50-1-RP', 'RS50', 'RS', 1, 'RP', 15.875, 22.2, 3.64, 0.68, 'Steel', 'catalog/rs50-catalog.pdf'],
                ['RS60-1-RP', 'RS60', 'RS', 1, 'RP', 19.05, 31.8, 5.09, 0.95, 'Steel', 'catalog/rs60-catalog.pdf'],
                ['RS80-1-RP', 'RS80', 'RS', 1, 'RP', 25.4, 56.0, 9.08, 1.86, 'Steel', 'catalog/rs80-catalog.pdf'],
                ['RS100-1-RP', 'RS100', 'RS', 1, 'RP', 31.75, 87.0, 22.6, 3.99, 'Steel', 'catalog/rs100-catalog.pdf'],
                ['RS08B-1-RP', 'RS08B', 'BS/DIN', 1, 'RP', 12.7, 19.0, 3.80, 0.70, 'Steel', 'catalog/rs08b-catalog.pdf'],
                ['RS10B-1-RP', 'RS10B', 'BS/DIN', 1, 'RP', 15.875, 23.0, 4.52, 0.95, 'Steel', 'catalog/rs10b-catalog.pdf'],
                ['RS16B-1-RP', 'RS16B', 'BS/DIN', 1, 'RP', 25.4, 70.0, 13.1, 2.70, 'Steel', 'catalog/rs16b-catalog.pdf']
            ];

            sampleChains.forEach(chain => {
                chainStmt.run(chain);
            });
            chainStmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM sprockets", (err, row) => {
        if (!err && row.count === 0) {
            const sprocketStmt = db.prepare(`INSERT INTO sprockets 
                (model_number, chain_size, teeth_count, hub_type, bore_type, pilot_bore, max_bore, hub_diameter, hub_length, outer_diameter, pitch_diameter, weight, material, tooth_hardening) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            // 샘플 스프로켓 데이터
            const sampleSprockets = [
                ['RS25-1B-15T', 'RS25', 15, '1B', 'Pilot', 6, 12, 17, 12, 48, 45.81, 0.16, 'Steel', 0],
                ['RS35-1B-20T', 'RS35', 20, '1B', 'Pilot', 8, 16, 22, 15, 65, 60.89, 0.32, 'Steel', 0],
                ['RS40-1B-25T', 'RS40', 25, '1B', 'Pilot', 10, 20, 25, 18, 82, 76.00, 0.44, 'Steel', 0],
                ['RS50-1B-18T', 'RS50', 18, '1B', 'Pilot', 12, 25, 30, 20, 97, 91.42, 0.51, 'Steel', 0],
                ['RS60-1B-20T', 'RS60', 20, '1B', 'Pilot', 15, 30, 35, 25, 129, 121.78, 1.0, 'Steel', 0],
                ['RS80-1B-22T', 'RS80', 22, '1B', 'Pilot', 19, 45, 67, 40, 192, 178.48, 4.7, 'Steel', 0],
                ['RS100-1B-20T', 'RS100', 20, '1B', 'Pilot', 18, 43, 65, 50, 220, 202.96, 6.7, 'Steel', 0],
                ['RS08B-1B-15T', 'RS08B', 15, '1B', 'Pilot', 9.53, 19, 35, 20, 65, 61.08, 0.34, 'Steel', 1],
                ['RS10B-1B-18T', 'RS10B', 18, '1B', 'Pilot', 12.7, 24, 42, 22, 77, 73.14, 0.51, 'Steel', 1],
                ['RS16B-1B-16T', 'RS16B', 16, '1B', 'Pilot', 15.88, 32, 54, 25, 140, 130.20, 2.8, 'Steel', 1]
            ];

            sampleSprockets.forEach(sprocket => {
                sprocketStmt.run(sprocket);
            });
            sprocketStmt.finalize();
        }
    });
});

// 검색 함수들
const searchChains = (filters, callback) => {
    let query = "SELECT * FROM chains WHERE 1=1";
    const params = [];

    if (filters.chain_size) {
        query += " AND chain_size = ?";
        params.push(filters.chain_size);
    }
    if (filters.series) {
        query += " AND series = ?";
        params.push(filters.series);
    }
    if (filters.strands) {
        query += " AND strands = ?";
        params.push(filters.strands);
    }
    if (filters.pin_type) {
        query += " AND pin_type = ?";
        params.push(filters.pin_type);
    }
    if (filters.material) {
        query += " AND material = ?";
        params.push(filters.material);
    }

    query += " ORDER BY chain_size, strands";

    db.all(query, params, callback);
};

const searchSprockets = (filters, callback) => {
    let query = "SELECT * FROM sprockets WHERE 1=1";
    const params = [];

    if (filters.chain_size) {
        query += " AND chain_size = ?";
        params.push(filters.chain_size);
    }
    if (filters.teeth_min && filters.teeth_max) {
        query += " AND teeth_count BETWEEN ? AND ?";
        params.push(filters.teeth_min, filters.teeth_max);
    } else if (filters.teeth_min) {
        query += " AND teeth_count >= ?";
        params.push(filters.teeth_min);
    } else if (filters.teeth_max) {
        query += " AND teeth_count <= ?";
        params.push(filters.teeth_max);
    }
    if (filters.hub_type) {
        query += " AND hub_type = ?";
        params.push(filters.hub_type);
    }
    if (filters.bore_type) {
        query += " AND bore_type = ?";
        params.push(filters.bore_type);
    }
    if (filters.material) {
        query += " AND material = ?";
        params.push(filters.material);
    }
    if (filters.tooth_hardening !== undefined) {
        query += " AND tooth_hardening = ?";
        params.push(filters.tooth_hardening);
    }

    query += " ORDER BY chain_size, teeth_count";

    db.all(query, params, callback);
};

// 통계 함수들
const getChainStats = (callback) => {
    const queries = [
        "SELECT chain_size, COUNT(*) as count FROM chains GROUP BY chain_size ORDER BY chain_size",
        "SELECT series, COUNT(*) as count FROM chains GROUP BY series ORDER BY series",
        "SELECT strands, COUNT(*) as count FROM chains GROUP BY strands ORDER BY strands"
    ];

    Promise.all(queries.map(query => 
        new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    )).then(results => {
        callback(null, {
            by_size: results[0],
            by_series: results[1],
            by_strands: results[2]
        });
    }).catch(callback);
};

const getSprocketStats = (callback) => {
    const queries = [
        "SELECT chain_size, COUNT(*) as count FROM sprockets GROUP BY chain_size ORDER BY chain_size",
        "SELECT hub_type, COUNT(*) as count FROM sprockets GROUP BY hub_type ORDER BY hub_type",
        "SELECT teeth_count, COUNT(*) as count FROM sprockets GROUP BY teeth_count ORDER BY teeth_count"
    ];

    Promise.all(queries.map(query => 
        new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    )).then(results => {
        callback(null, {
            by_size: results[0],
            by_hub_type: results[1],
            by_teeth: results[2]
        });
    }).catch(callback);
};

module.exports = {
    db,
    searchChains,
    searchSprockets,
    getChainStats,
    getSprocketStats
};