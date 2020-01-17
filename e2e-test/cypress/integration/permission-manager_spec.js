/// <reference types="cypress" />
/// <reference types="@types/testing-library__cypress" />

describe("My First Test", function() {
  it('clicking "type" shows the right headings', function() {
    const username = "test-user-" + Date.now();
    const templateName = "developer";

    cy.visit("http://admin:secret@localhost:3000");

    cy.contains(/create new user/i).click();

    /* USER CREATION PAGE */

    cy.url().should("include", "/new-user");

    // Get an input, type into it and verify that the value has been updated

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
      .eq(0)
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
});
