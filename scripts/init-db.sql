CREATE TABLE users (
    id TEXT PRIMARY KEY,
    secondsToGrade INTEGER
);

CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    application_json TEXT
);

CREATE TABLE locks (
    grader_id TEXT NOT NULL UNIQUE,
    application_id TEXT NOT NULL REFERENCES applications(id),
    expire_time INTEGER NOT NULL
);

CREATE TABLE grades (
    grader_id TEXT,
    application_id TEXT REFERENCES applications(id),
    grade_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    netid TEXT,
    token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
