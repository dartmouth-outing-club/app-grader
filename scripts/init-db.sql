CREATE TABLE users (
    id TEXT PRIMARY KEY,
    secondsToGrade INTEGER
);

CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    application_json TEXT
);

CREATE TABLE locks (
    grader_id TEXT,
    application_id TEXT REFERENCES applications(id),
    expire_time INTEGER
);

CREATE TABLE grades (
    grader_id TEXT,
    application_id TEXT REFERENCES applications(id),
    grade_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
