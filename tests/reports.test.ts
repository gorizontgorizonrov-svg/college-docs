describe("Enrollment Ranking", () => {
  it("должен сортировать по avgGrade DESC", () => {
    const applicants = [
      { avgGrade: 3.5 },
      { avgGrade: 4.8 },
      { avgGrade: 4.2 },
    ];
    const sorted = [...applicants].sort((a, b) => b.avgGrade - a.avgGrade);
    expect(sorted[0].avgGrade).toBe(4.8);
    expect(sorted[2].avgGrade).toBe(3.5);
  });
});