import { pool } from "../../db";
import type { IIssue } from "./issues.interface";

const createIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, reporter_id } = payload;

  const result = await pool.query(
    `INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4)
      RETURNING *`,
    [title, description, type, reporter_id],
  );

  return result;
};

const getAllIssuesFromDB = async (payload: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort = "newest", type, status } = payload;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sort === "oldest" ? "ASC" : "DESC";

  const issuesResult = await pool.query(
    `SELECT * FROM issues ${where} ORDER BY created_at ${order}`,
    params,
  );

  const issues = issuesResult.rows;
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  const reporterMap = new Map(reportersResult.rows.map((u) => [u.id, u]));

  return issues.map(({ reporter_id, created_at, updated_at, ...issue }) => ({
    ...issue,
    reporter: reporterMap.get(reporter_id) || null,
    created_at,
    updated_at,
  }));
};

const getSingleIssueFromDB = async (id: string) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const { reporter_id, created_at, updated_at, ...rest } = issue;

  return {
    ...rest,
    reporter: reporterResult.rows[0] || null,
    created_at,
    updated_at,
  };
};

const updateIssueFromDB = async (
  payload: IIssue,
  id: string,
  userId: number,
  role: string,
) => {
  const { title, description, type } = payload;

  const existing = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);

  if (existing.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = existing.rows[0];

  if (role === "contributor") {
    if (issue.reporter_id !== userId) {
      throw new Error("You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("You can only update issues with open status");
    }
  }

  const result = await pool.query(
    `UPDATE issues
     SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [title, description, type, id],
  );

  return result.rows[0];
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);
  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB,
};
