// Set up node-fetch to work with nock
const nodeFetch = require('node-fetch');
global.fetch = nodeFetch;
global.Request = nodeFetch.Request;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;

const nock = require("nock");
const { Probot, ProbotOctokit } = require("probot");
const app = require("../src/index");
const handleMasterPRVersionCheck = require("../src/handlers/masterPRVersionCheckHandler");

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
    // Load just the handler we're testing instead of the full app
    probot.load((app) => {
      app.on(["pull_request.opened"], handleMasterPRVersionCheck);
    });
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
        content: Buffer.from(JSON.stringify({ version: "1.0.0" })).toString("base64")
      });

    // Mock the API endpoints for getting package.json from master branch
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/contents/package.json?ref=master")
      .reply(200, {
        content: Buffer.from(JSON.stringify({ version: "1.0.0" })).toString("base64")
      });

    // Mock the API endpoint for creating a comment
    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/5/comments", (body) => {
        return body.body.includes("VERSION ERROR DETECTED") && 
               body.body.includes("has not been updated");
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  }, 10000); // Increase timeout to 10 seconds

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
        content: Buffer.from(JSON.stringify({ version: "1.0.1" })).toString("base64")
      });

    // Mock the API endpoints for getting package.json from master branch
    nock("https://api.github.com")
      .get("/repos/octocat/hello-world/contents/package.json?ref=master")
      .reply(200, {
        content: Buffer.from(JSON.stringify({ version: "1.0.0" })).toString("base64")
      });

    // Mock the API endpoint for creating a comment
    const commentMock = nock("https://api.github.com")
      .post("/repos/octocat/hello-world/issues/6/comments", (body) => {
        return body.body.includes("VERSION CHECK PASSED") && 
               body.body.includes("has been properly updated");
      })
      .reply(200);

    // Simulate the webhook
    await probot.receive({ name: "pull_request", payload });

    // Ensure API endpoint was called
    expect(commentMock.isDone()).toBe(true);
  }, 10000); // Increase timeout to 10 seconds
});
