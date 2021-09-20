/// <reference types="cypress" />
/// <reference types="@types/testing-library__cypress" />

it("Create use and save kubeconfig YAML to disk", function() {
  /* SETUP */
  const templateName = "developer";
  const username = `test-user-${templateName}-${Date.now()}`;


  /* INDEX PAGE */
  //todo hardcoded password coming from the tests folder
  cy.visit("http://admin:1v2d1e2e67dS@localhost:4000");

  cy.contains(/create new user/i).click();

  /* USER CREATION PAGE */
  cy.url().should("include", "/new-user");

  cy.queryByTestId("summmary").should("not.exist");

  cy.findByLabelText(/username/i)
    .type(username)
    .should("have.value", username);

  cy.findByText(/add/i).should("be.disabled");

  cy.findByText(/save/i).should("be.disabled");

  cy.findByTestId("template-select")
    .findByText(templateName)
    .should("exist");

  cy.get("[class$=-control]")
    .eq(1)
    .click(0, 0, { force: true });

  cy.findByTestId("namespaces-select")
    .get("[class$=-option]")
    .contains("default")
    .click({ force: true });

  cy.findByTestId("namespaces-select")
    .get(".css-12jo7m5") /* the tag of selected item */
    .contains("default");

  cy.findByLabelText("none").should("be.checked");

  cy.findByText(/add/i).should("not.be.disabled");

  cy.findByText(/save/i).should("not.be.disabled");

  cy.get("[data-testid=summary]").should("exist");

  cy.findByText(/save/i).click();

  /* USER DETAIL PAGE */
  cy.url().should("include", "/users/" + username);

  cy.findByTestId("username-heading").should("have.text", username);

  cy.findByTestId("template-select")
    .findByText(templateName)
    .should("exist");

  cy.findByText(/show kubeconfig/i).click();

  /* KUBECONFIG DIALOG */

  cy.wait(500);
  cy.findByTestId("yaml").should("exist");
  cy.findByText(/copy/i).click();
  cy.findByText(/copied/i).should("exist");
  cy.findByText(/copy/i).should("not.exist");

  cy.findByTestId("yaml")
    .get("textarea")
    .should("have.include.value", "apiVersion: v1")
    .invoke("val")
    .then(kubeconfigYAML => {
      console.log(kubeconfigYAML);

      cy.writeFile(`data/kubeconfigs/${username}`, kubeconfigYAML);
    });
});

// This test covers this issue https://github.com/sighupio/permission-manager/issues/78
it("Cluster resources after save check", () => {
  /* SETUP */
  const templateName = "developer";
  const username = `test-user-${templateName}-${Date.now()}-2`;


  /* INDEX PAGE */
  //todo hardcoded password coming from the tests folder
  cy.visit("http://admin:1v2d1e2e67dS@localhost:4000");

  cy.contains(/create new user/i).click();

  /* USER CREATION PAGE */
  cy.url().should("include", "/new-user");

  cy.queryByTestId("summmary").should("not.exist");

  cy.findByLabelText(/username/i)
      .type(username)
      .should("have.value", username);

  cy.findByText(/add/i).should("be.disabled");

  cy.findByText(/save/i).should("be.disabled");

  cy.findByTestId("template-select")
      .findByText(templateName)
      .should("exist");

  cy.get("[class$=-control]")
      .eq(1)
      .click(0, 0, { force: true });

  cy.findByTestId("namespaces-select")
      .get("[class$=-option]")
      .contains("default")
      .click({ force: true });

  cy.findByTestId("namespaces-select")
      .get(".css-12jo7m5") /* the tag of selected item */
      .contains("default");

  cy.findByTestId("nonnamespaced-select")
      .findByText("read-only")
      .click({force: true})

  cy.findByLabelText("read-only").should("be.checked");

  cy.findByText(/add/i).should("not.be.disabled");

  cy.findByText(/save/i).should("not.be.disabled");

  cy.get("[data-testid=summary]").should("exist");

  cy.findByText(/save/i).click();

  cy.url().should("include", "/users/" + username);

  cy.findByTestId("username-heading").should("have.text", username);

  cy.contains('a', 'users').click();

  cy.contains('a', username).click();

  cy.findByLabelText("read-only").should("be.checked");
})
