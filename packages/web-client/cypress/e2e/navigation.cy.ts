describe('Navigation test', () => {
  const TEST_HOST = Cypress.env('TEST_HOST') || 'https://hotornot.wtf'
  const timeout = 20_000

  before(() => {
    cy.task('log', 'Running tests on host: ' + TEST_HOST)
  })

  beforeEach(() => {
    cy.visit(TEST_HOST + '/feed')
  })

  it('On load, should be navigated to home feed', () => {
    cy.url().should('contain', 'feed')
  })

  it('Navigate to user profile from the feed', () => {
    cy.get('div[aria-roledescription=video-info] > a', {
      timeout,
    })
      .first()
      .click({ force: true })

    expect(cy.url().should('contain', 'profile'))
  })

  it("Navigate to user profile and then navigate to user's lovers list", () => {
    cy.get('div[aria-roledescription=video-info] > a', {
      timeout,
    })
      .first()
      .click({ force: true })

    cy.contains('Lovers', { timeout: 20_000 }).click({ force: true })
    expect(cy.url().should('contain', 'lovers'))
  })

  it('Navigate to user profile and then view a post', () => {
    cy.get('div[aria-roledescription=video-info] > a', {
      timeout,
    })
      .first()
      .click({ force: true })
    cy.scrollTo('bottom')

    cy.get('a[aria-roledescription=user-post]', { timeout })
      .first()
      .click({ force: true })
      .then(() => {
        expect(cy.url().should('contain', 'post'))
      })
  })
})
