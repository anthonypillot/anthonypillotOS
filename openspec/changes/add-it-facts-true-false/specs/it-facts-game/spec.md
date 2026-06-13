## ADDED Requirements

### Requirement: Display IT fact for evaluation

The page at `/tools/it-facts` SHALL display a single IT universe statement at a time, along with two answer choices: **True** and **False**. The page SHALL be reachable from the site's main navigation, the `/tools` index, and the BaseHeader "Tools" popover.

#### Scenario: Visitor opens the game page

- **WHEN** a user navigates to `/tools/it-facts`
- **THEN** the page renders the hero section with a heading identifying the game and a control to start a round
- **AND** the game is listed on `/tools` with a link to `/tools/it-facts`
- **AND** the BaseHeader "Tools" popover contains an entry linking to `/tools/it-facts`

#### Scenario: Visitor starts a round

- **WHEN** the user activates the start control on the game page
- **THEN** the game section displays the first IT fact statement
- **AND** it displays True and False answer controls
- **AND** it shows a progress indicator for the current round (for example "Question 1 of 10")

### Requirement: Round contains exactly ten facts

A single round SHALL consist of exactly ten facts drawn from the curated dataset, presented in a randomized order that MAY differ between rounds.

#### Scenario: Round length

- **WHEN** a user starts a new round
- **THEN** the round contains exactly ten questions
- **AND** after the tenth answer the round ends and the result screen is shown

#### Scenario: Order varies between rounds

- **WHEN** a user starts a round, then restarts, then starts again
- **THEN** the order of facts in each round is not guaranteed to be identical
- **AND** the same fact MAY appear in different positions in different rounds

### Requirement: Immediate per-question feedback

After the user answers a fact, the game SHALL immediately reveal whether the answer was correct, state the correct answer, and show a short explanation. Answer controls SHALL be disabled until the user advances to the next question.

#### Scenario: Correct answer

- **WHEN** the user selects the answer that matches the fact's `isTrue` value
- **THEN** the game indicates the answer was correct
- **AND** the game displays the short explanation for that fact
- **AND** the running score for the round is incremented by one

#### Scenario: Incorrect answer

- **WHEN** the user selects the answer that does not match the fact's `isTrue` value
- **THEN** the game indicates the answer was incorrect
- **AND** the game states the correct answer
- **AND** the game displays the short explanation for that fact
- **AND** the running score is not changed

#### Scenario: Cannot change answer after submitting

- **WHEN** the game is showing feedback for the current question
- **THEN** the True and False answer controls are disabled
- **AND** the user can only advance to the next question or to the result

### Requirement: Final result with restart

When a round ends, the game SHALL display a result screen showing the current round's score, the player's all-time best score, and a control to start a new round.

#### Scenario: Show result at end of round

- **WHEN** the user has answered all ten questions in a round
- **THEN** the result screen displays the current score out of ten
- **AND** the result screen displays the best score the player has ever achieved
- **AND** the result screen exposes a control labelled "Play again" (or equivalent) that starts a new round

#### Scenario: Restart resets the round state

- **WHEN** the user activates the restart control on the result screen
- **THEN** the game returns to a fresh round of ten questions
- **AND** the previous answers and per-round score are cleared

### Requirement: Best score persistence

The player's all-time best score MUST be persisted in `localStorage` under the key `it-facts:best` as a non-negative integer. The best score SHALL be updated only when a finished round's score strictly exceeds the previously stored best. The best score MUST be read on the client only; server-rendered output MUST show `0` for the best score on the first paint to avoid hydration mismatches.

#### Scenario: First ever round sets the best score

- **WHEN** a user finishes a round and no `it-facts:best` value exists in `localStorage`
- **THEN** the result screen displays the round score as the best score
- **AND** `localStorage.getItem("it-facts:best")` equals that score as a string

#### Scenario: Beating the previous best updates it

- **WHEN** a user finishes a round whose score is strictly greater than the value stored in `it-facts:best`
- **THEN** the value of `it-facts:best` is updated to the new score
- **AND** the result screen displays the new best score

#### Scenario: Not beating the best leaves it unchanged

- **WHEN** a user finishes a round whose score is less than or equal to the value stored in `it-facts:best`
- **THEN** the value of `it-facts:best` is not modified
- **AND** the result screen displays the previous best score

#### Scenario: Malformed stored value is ignored

- **WHEN** the value of `it-facts:best` in `localStorage` is not a valid non-negative integer
- **THEN** the game treats the best score as `0` for display and update purposes
- **AND** the value is overwritten on the next improvement

### Requirement: Curated IT facts dataset

The game SHALL source its facts from a typed, in-repo dataset. Each fact MUST have a stable `id`, a `statement`, a boolean `isTrue` indicating the correct answer, a short `explanation`, and an optional `source` reference. The dataset MUST contain at least ten distinct facts so that a full round never repeats a fact within itself.

#### Scenario: Dataset shape

- **WHEN** the dataset is loaded
- **THEN** every entry is an `ItFact` with a non-empty `id`, `statement`, and `explanation`
- **AND** every entry's `isTrue` is a boolean

#### Scenario: Enough facts for a round

- **WHEN** the game assembles a round
- **THEN** it selects ten facts with distinct `id` values
- **AND** it does not select the same fact twice within a single round

### Requirement: SEO and caching

The page at `/tools/it-facts` MUST set its own `title`, `description`, and (when an illustration exists) `favicon` through `useSeo()`. The route MUST be registered in `nuxt.config.ts → routeRules` with `swr: true` so that static rendering is cached, consistent with the other `/tools/*` pages.

#### Scenario: SEO metadata

- **WHEN** a user views `/tools/it-facts`
- **THEN** the document `<title>` is "IT Facts True/False" (or a clearly equivalent custom title set via `useSeo`)
- **AND** the meta description is set from `useSeo`
- **AND** the page does not reuse the home page's default SEO

#### Scenario: SWR caching

- **WHEN** `nuxt.config.ts` is inspected
- **THEN** the `routeRules` object contains `"/tools/it-facts": { swr: true }`

### Requirement: Accessibility of controls

The True, False, Next, Start, and Play-again controls MUST be implemented as real interactive elements (buttons or links) with visible text labels. The feedback state after each question MUST be conveyed both visually (color/icon) and with explicit text ("Correct" / "Incorrect") so it is not communicated by color alone.

#### Scenario: Controls have labels

- **WHEN** the game renders the True/False/Next/Start/Play-again controls
- **THEN** each control exposes a discernible text label to assistive technology
- **AND** none of these controls is implemented as a non-interactive element

#### Scenario: Feedback is not color-only

- **WHEN** the user submits an answer
- **THEN** the feedback region contains a textual indicator such as "Correct" or "Incorrect"
- **AND** the explanation text is rendered as plain text
