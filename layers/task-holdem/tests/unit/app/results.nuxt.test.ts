import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import VoteDistribution from "../../../app/components/task-holdem/VoteDistribution.vue";
import { getTaskHoldemVoteSummary } from "../../../app/utils/results";

describe("Task Hold'em descriptive vote results", () => {
  test("groups votes in deck order and accounts for special cards separately", () => {
    expect(getTaskHoldemVoteSummary(["break", 13, 5, "skip", 5, "skip"])).toEqual({
      total: 6, numeric: 3, pass: 2, unsure: 1,
      distribution: [{ value: 5, count: 2 }, { value: 13, count: 1 }, { value: "skip", count: 2 }, { value: "break", count: 1 }],
    });
  });

  test("handles empty results and rounds with only special cards", () => {
    expect(getTaskHoldemVoteSummary([])).toEqual({ total: 0, numeric: 0, pass: 0, unsure: 0, distribution: [] });
    expect(getTaskHoldemVoteSummary(["skip", "break"])).toMatchObject({ total: 2, numeric: 0, pass: 1, unsure: 1 });
  });

  test("exposes textual counts without depending on color or bar widths", () => {
    const ballots = [5, 5, "break"] as const;
    const wrapper = mount(VoteDistribution, { props: { ballots: ballots.map((value, index) => ({ participantId: `participant-${index}`, profile: { name: "Player", avatar: "cowboy" }, value })) } });
    try {
      expect(wrapper.text()).toContain("3 votes cast · 2 numeric · 0 Pass · 1 Unsure");
      expect(wrapper.findAll("li").map(item => item.attributes("aria-label"))).toEqual(["5: 2 votes", "Unsure: 1 vote"]);
      expect(wrapper.find("[style]").attributes("style")).toContain("66.666");
    } finally {
      wrapper.unmount();
    }
  });
});
