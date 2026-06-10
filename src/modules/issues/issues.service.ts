import { pool } from "../../db";
import type { IIssue } from "./issues.interface";

const createIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, reporter_id } = payload;

  const result = await pool.query(
    `
      INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4)
      RETURNING *
    `,
    [title, description, type, reporter_id],
  );

  return result;
};

const getAllIssuesFromDB = async (query: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort = "newest", type, status } = query;

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

  return issues.map(({ reporter_id, ...issue }) => ({
    ...issue,
    reporter: reporterMap.get(reporter_id) || null,
  }));
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
