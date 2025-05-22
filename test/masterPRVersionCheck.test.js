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

describe("Master PR Version Check", () => {
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

  test("warns when PR to master has no version change", async () => {
    // Create a fake PR payload
    const payload = {
      action: "opened",
      pull_request: {
        number: 5,
        head: {
          sha: "pr-branch-sha",
          ref: "feature-branch"
        },
        base: {
          ref: "master"
        },
        title: "Update documentation"
      },
      repository: {
        name: "hello-world",
        owner: {
          login: "octocat"
        }
      }
    };

    // Mock the API endpoints for getting package.json from PR branch
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/contents/package.json?ref=pr-branch-sha")
      .reply(200, {
        content: Buffer.from(JSON.stringify({ version: "0.0.1" })).toString("base64")
      });

    // Mock the API endpoints for getting package.json from master branch
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/contents/package.json?ref=master")
      .reply(200, {
        content: Buffer.from(JSON.stringify({ version: "0.0.1" })).toString("base64")
      });

    // Mock the API endpoint for creating a comment
    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/5/comments", (body) => {
        expect(body.body).toMatch("🤖");
        expect(body.body).toMatch("VERSION ERROR DETECTED");
        expect(body.body).toMatch("has not been updated");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  });

  test("approves when PR to master has version change", async () => {
    // Create a fake PR payload
    const payload = {
      action: "opened",
      pull_request: {
        number: 6,
        head: {
          sha: "pr-branch-sha",
          ref: "feature-branch"
        },
        base: {
          ref: "master"
        },
        title: "Update with new feature"
      },
      repository: {
        name: "hello-world",
        owner: {
          login: "octocat"
        }
      }
    };

    // Mock the API endpoints for getting package.json from PR branch
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/contents/package.json?ref=pr-branch-sha")
      .reply(200, {
        content: Buffer.from(JSON.stringify({ version: "0.0.2" })).toString("base64")
      });

    // Mock the API endpoints for getting package.json from master branch
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/contents/package.json?ref=master")
      .reply(200, {
        content: Buffer.from(JSON.stringify({ version: "0.0.1" })).toString("base64")
      });

    // Mock the API endpoint for creating a comment
    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/6/comments", (body) => {
        expect(body.body).toMatch("🤖");
        expect(body.body).toMatch("VERSION CHECK PASSED");
        expect(body.body).toMatch("has been properly updated");
        return true;
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  });
});
