describe('Shift', () => {
    beforeEach(() => {
        cy.deleteAllButArs();
        cy.createDemoEntities();
        cy.createDatabaseInfoForShift();
    });

    afterEach(() => {
        cy.deleteAllButArs();
    });

    it('create shifts', () => {
        const LOCATION = 'Rua Médico Sousa Refóios 64, Mirandela';
        const NUMBER = '3';
        const today = new Date();
        const day = today.getDate();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.getDate();

        cy.demoMemberLogin()

        cy.intercept('POST', '/activities/*/shift').as('createShift');

        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');
        cy.intercept('GET', '/activities/*/shifts').as('getShifts');

        cy.get('[data-cy="institution"]').click();

        cy.get('[data-cy="activities"]').click();
        cy.wait('@getInstitutions');

        cy.get('[data-cy="showShifts"]').first().click();
        cy.wait('@getShifts');

        cy.get('[data-cy="newShift"]').click();

        // fill form
        cy.get('[data-cy="locationInput"]').type(LOCATION);
        cy.get('[data-cy="participantsLimitInput"]').type(NUMBER);

        // select dates
        cy.get('#endTimeInput-input').click();
        cy.get('#endTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', tomorrowDay.toString())
            .click({ force: true });
        cy.get('#startTimeInput-input').click();
        cy.get('#startTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', day.toString())
            .click({ force: true });

        // save
        cy.get('[data-cy="saveShift"]').click()
        // check request was done
        cy.wait('@createShift')
        // check results
        cy.get('[data-cy="activityShiftsTable"] tbody tr')
            .should('have.length', 1)
            .eq(0)
            .children()
            .eq(3)
            .should('contain', LOCATION);

        cy.get('[data-cy="activityShiftsTable"] tbody tr')
            .eq(0)
            .children()
            .eq(2)
            .should('contain', NUMBER);

        cy.logout();
    });

    it('checks location length validation', () => {
        const LOCATION19 = 'a'.repeat(19);
        const LOCATION20 = 'a'.repeat(20);
        const LOCATION200 = 'a'.repeat(200);
        const LOCATION201 = 'a'.repeat(201);
        const NUMBER = '3';
        const today = new Date();
        const day = today.getDate();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.getDate();

        cy.demoMemberLogin()

        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');
        cy.intercept('GET', '/activities/*/shifts').as('getShifts');

        cy.get('[data-cy="institution"]').click();

        cy.get('[data-cy="activities"]').click();
        cy.wait('@getInstitutions');

        cy.get('[data-cy="showShifts"]').first().click();
        cy.wait('@getShifts');

        cy.get('[data-cy="newShift"]').click();

        cy.get('[data-cy="participantsLimitInput"]').type(NUMBER);

        // select dates
        cy.get('#endTimeInput-input').click();
        cy.get('#endTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', tomorrowDay.toString())
            .click({ force: true });

        cy.get('#startTimeInput-input').click();
        cy.get('#startTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', day.toString())
            .click({ force: true });

        cy.get('[data-cy="locationInput"]').clear().type(LOCATION19);
        cy.get('[data-cy="saveShift"]').should('be.disabled');

        cy.get('[data-cy="locationInput"]').clear().type(LOCATION20);
        cy.get('[data-cy="saveShift"]').should('not.be.disabled');

        cy.get('[data-cy="locationInput"]').clear().type(LOCATION200);
        cy.get('[data-cy="saveShift"]').should('not.be.disabled');


        cy.get('[data-cy="locationInput"]').clear().type(LOCATION201);
        cy.get('[data-cy="saveShift"]').should('be.disabled');

        cy.logout();
    });

    it('shows an error when shift dates are outside the activity dates', () => {
        const LOCATION = 'Rua Médico Sousa Refóios 64, Mirandela';
        const NUMBER = '3';

        const today = new Date();
        const tomorrow = new Date();
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(today.getDate() + 2);
        tomorrow.setDate(tomorrow.getDate() + 1);

        cy.demoMemberLogin();

        cy.intercept('POST', '/activities/*/shift').as('createShift');
        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');
        cy.intercept('GET', '/activities/*/shifts').as('getShifts');

        cy.get('[data-cy="institution"]').click();
        cy.get('[data-cy="activities"]').click();
        cy.wait('@getInstitutions');

        cy.get('[data-cy="showShifts"]').first().click();
        cy.wait('@getShifts');

        cy.get('[data-cy="newShift"]').click();

        cy.get('[data-cy="locationInput"]').type(LOCATION);
        cy.get('[data-cy="participantsLimitInput"]').type(NUMBER);

        cy.get('#endTimeInput-input').click();
        cy.get('#endTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', dayAfterTomorrow.getDate().toString())
            .click({ force: true });

        cy.get('#startTimeInput-input').click();
        cy.get('#startTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', today.getDate().toString())
            .click({ force: true });


        cy.get('[data-cy="saveShift"]').click();

        cy.wait('@createShift').then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([400, 422]);
        });

        cy.logout();
    });

    it('disabled "Create Shift" Button on Unapproved Activity', () => {
        cy.demoMemberLogin();

        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');
        cy.intercept('GET', '/activities/*/shifts').as('getShifts');

        cy.get('[data-cy="institution"]').click();

        cy.get('[data-cy="activities"]').click();
        cy.wait('@getInstitutions');

        cy.get('[data-cy="showShifts"]').eq(0).click();
        cy.wait('@getShifts');
        cy.get('[data-cy="newShift"]').should('not.be.disabled');
        cy.get('[data-cy="backToActivities"]').click();

        cy.get('[data-cy="showShifts"]').eq(1).click();
        cy.wait('@getShifts');
        cy.get('[data-cy="newShift"]').should('be.disabled');
        cy.get('[data-cy="backToActivities"]').click();

        cy.get('[data-cy="showShifts"]').eq(2).click();
        cy.wait('@getShifts');
        cy.get('[data-cy="newShift"]').should('be.disabled');
        cy.get('[data-cy="backToActivities"]').click();

        cy.logout();
    });


    it('shows an error when shift start is after end', () => {
        const LOCATION = 'Rua Médico Sousa Refóios 64, Mirandela';
        const NUMBER = '3';

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        cy.demoMemberLogin();

        cy.intercept('POST', '/activities/*/shift').as('createShift');
        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');
        cy.intercept('GET', '/activities/*/shifts').as('getShifts');

        cy.get('[data-cy="institution"]').click();

        cy.get('[data-cy="activities"]').click();
        cy.wait('@getInstitutions');

        cy.get('[data-cy="showShifts"]').first().click();
        cy.wait('@getShifts');

        cy.get('[data-cy="newShift"]').click();

        cy.get('[data-cy="locationInput"]').type(LOCATION);
        cy.get('[data-cy="participantsLimitInput"]').type(NUMBER);

        cy.get('#endTimeInput-input').click();
        cy.get('#endTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', today.getDate().toString())
            .click({ force: true });

        cy.get('#startTimeInput-input').click();
        cy.get('#startTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', tomorrow.getDate().toString())
            .click({ force: true });

        cy.get('[data-cy="saveShift"]').click();

        cy.wait('@createShift').then(({ response }) => {
            expect(response.statusCode).to.eq(400);
        });

        cy.logout();
    });

    it('shows an error when the sum of two shifts exceeds the activity participants limit', () => {
        const LOCATION1 = 'Rua Médico Sousa Refóios 64, Mirandela';
        const LOCATION2 = 'Rua Paio Peres Correia 20, Lisboa';

        const SHIFT_1_LIMIT = 3;
        const SHIFT_2_LIMIT = 3;

        const TOTAL = SHIFT_1_LIMIT + SHIFT_2_LIMIT;

        const today = new Date();
        const tomorrow = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const day = today.getDate();
        const yesterdayDay = yesterday.getDate()
        const tomorrowDay = tomorrow.getDate();

        cy.demoMemberLogin();

        cy.intercept('POST', '/activities/*/shift').as('createShift');
        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');
        cy.intercept('GET', '/activities/*/shifts').as('getShifts');

        cy.get('[data-cy="institution"]').click();
        cy.get('[data-cy="activities"]').click();
        cy.wait('@getInstitutions');

        cy.get('[data-cy="showShifts"]').first().click();
        cy.wait('@getShifts');

        cy.get('[data-cy="newShift"]').click();

        cy.get('[data-cy="locationInput"]').type(LOCATION1);
        cy.get('[data-cy="participantsLimitInput"]').type(SHIFT_1_LIMIT);

        cy.get('#endTimeInput-input').click();
        cy.get('#endTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', day.toString())
            .click({ force: true });
        cy.get('#startTimeInput-input').click();
        cy.get('#startTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', yesterdayDay.toString())
            .click({ force: true });

        cy.get('[data-cy="saveShift"]').click();
        cy.wait('@createShift').its('response.statusCode').should('be.oneOf', [200, 201]);

        cy.get('[data-cy="newShift"]').click();
        cy.get('[data-cy="locationInput"]').type(LOCATION2);
        cy.get('[data-cy="participantsLimitInput"]').type(SHIFT_2_LIMIT);


        cy.get('#endTimeInput-input').click();
        cy.get('#endTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', tomorrowDay.toString())
            .click({ force: true });
        cy.get('#startTimeInput-input').click();
        cy.get('#startTimeInput-wrapper.date-time-picker')
            .contains('.datepicker-day-text', day.toString())
            .click({ force: true });

        cy.get('[data-cy="saveShift"]').click();

        cy.wait('@createShift').then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([400, 422]);
        });

    });

});
