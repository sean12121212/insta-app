import { html, fixture, expect } from '@open-wc/testing';
import "../insta-app.js";

describe("InstaApp test", () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`
      <insta-app
        title="title"
      ></insta-app>
    `);
  });

  it("basic will it blend", async () => {
    expect(element).to.exist;
  });

  it("passes the a11y audit", async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
