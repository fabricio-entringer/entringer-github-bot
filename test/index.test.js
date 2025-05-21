// Set up node-fetch to work with nock
const nodeFetch = require('node-fetch');
global.fetch = nodeFetch;
global.Request = nodeFetch.Request;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;

const nock = require("nock");
const { Probot, ProbotOctokit } = require("probot");
const app = require("../src/index");

nock.disableNetConnect();

describe("GitHub Bot", () => {
  let probot;

  beforeEach(() => {
    probot = new Probot({
      appId: 1,
      privateKey: "test",
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    probot.load(app);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test("creates a comment when an issue is opened", async () => {
    const payload = require("./fixtures/issues.opened.json");

    // Mock the API endpoints
    const mock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/1/comments", (body) => {
        expect(body.body).toMatch("Thanks for opening this issue");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "issues", payload });

    // Ensure API endpoint was called
    expect(mock.isDone()).toBe(true);
  });

  test("creates a comment when a PR is opened", async () => {
    const payload = require("./fixtures/pull_request.opened.json");

    // Mock the API endpoints
    const mock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/1/comments", (body) => {
        expect(body.body).toMatch("Pull request title should reference an issue number");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(mock.isDone()).toBe(true);
  });

  test("validates PR title with valid issue number", async () => {
    const payload = {
      ...require("./fixtures/pull_request.opened.json"),
      pull_request: {
        ...require("./fixtures/pull_request.opened.json").pull_request,
        title: "Fix bug #123",
      },
    };

    // Mock the API endpoints
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/issues/123")
      .reply(200, { number: 123 });

    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/1/comments", (body) => {
        expect(body.body).toMatch("successfully linked to issue #123");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  });

  test("warns when PR title has no issue number", async () => {
    const payload = {
      ...require("./fixtures/pull_request.opened.json"),
      pull_request: {
        ...require("./fixtures/pull_request.opened.json").pull_request,
        title: "Fix bug without issue number",
      },
    };

    // Mock the API endpoints
    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/1/comments", (body) => {
        expect(body.body).toMatch("Pull request title should reference an issue number");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  });

  test("warns when PR references non-existent issue", async () => {
    const payload = {
      ...require("./fixtures/pull_request.opened.json"),
      pull_request: {
        ...require("./fixtures/pull_request.opened.json").pull_request,
        title: "Fix bug #999",
      },
    };

    // Mock the API endpoints
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/issues/999")
      .reply(404);

    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/1/comments", (body) => {
        expect(body.body).toMatch("Referenced issue #999 does not exist");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  });
});
