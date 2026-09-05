import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OverallAnalytics, Question } from '../types';

export interface ReportOptions {
  studentName: string;
  assessmentTarget: string;
  notes?: string;
  includeSkillBreakdown?: boolean;
  includeRecommendations?: boolean;
}

export function generatePSATProgressPDF(
  analytics: OverallAnalytics,
  allQuestions: Question[],
  options: ReportOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [37, 99, 235]; // Indigo/Blue #2563eb
  const darkTextColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const grayTextColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header & Branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PSAT / SAT DIAGNOSTIC & PROFICIENCY REPORT', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Target Assessment: ${options.assessmentTarget || 'PSAT 8/9 & PSAT 10'}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 20);

  // 2. Student Info Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, 182, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 32, 182, 24, 2, 2, 'D');

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Student: ${options.studentName || 'PSAT Scholar'}`, 18, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayTextColor);
  doc.text(`Questions Practiced: ${analytics.totalAttempted} / ${analytics.totalQuestions}`, 18, 48);
  doc.text(`Active Day Streak: ${analytics.currentStreak} Days`, 90, 48);
  doc.text(`Total Study Time: ${Math.round(analytics.timeSpentTotalSeconds / 60)} min`, 150, 48);

  // 3. Performance Summary Metric Boxes
  const boxWidth = 43;
  const boxHeight = 22;
  const startY = 62;

  // Box 1: Overall Accuracy
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, startY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...grayTextColor);
  doc.text('OVERALL ACCURACY', 18, startY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`${analytics.overallAccuracy}%`, 18, startY + 16);

  // Box 2: Total Correct
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(60, startY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayTextColor);
  doc.text('QUESTIONS CORRECT', 64, startY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`${analytics.totalCorrect} / ${analytics.totalAttempted}`, 64, startY + 16);

  // Box 3: Projected Scaled Math
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(106, startY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayTextColor);
  doc.text('EST. BENCHMARK', 110, startY + 7);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const estScore = analytics.totalAttempted > 0 ? Math.min(720, Math.round(300 + (analytics.overallAccuracy / 100) * 420)) : 450;
  doc.setTextColor(147, 51, 234); // Purple
  doc.text(`${estScore} / 720`, 110, startY + 16);

  // Box 4: Mastered Topics
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(152, startY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayTextColor);
  doc.text('SKILLS PRACTICED', 156, startY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(`${Object.keys(analytics.skillProficiency).length}`, 156, startY + 16);

  // 4. Domain Mastery Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('Domain Proficiency Breakdown', 14, startY + 32);

  const domainRows = Object.entries(analytics.domainProficiency).map(([domain, stats]) => [
    domain,
    `${stats.attempted}`,
    `${stats.correct}`,
    `${stats.accuracyPercent}%`,
    `${stats.masteryPercent}%`,
    stats.accuracyPercent >= 80 ? 'Proficient' : stats.accuracyPercent >= 60 ? 'Developing' : 'Needs Practice'
  ]);

  autoTable(doc, {
    startY: startY + 36,
    head: [['Domain', 'Attempted', 'Correct', 'Accuracy', 'Mastery Index', 'Proficiency Status']],
    body: domainRows.length > 0 ? domainRows : [['Algebra', '0', '0', '0%', '0%', 'Pending Practice']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: darkTextColor
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // 5. Skill Level Diagnostics
  const finalY = (doc as any).lastAutoTable?.finalY || 135;

  if (options.includeSkillBreakdown !== false) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkTextColor);
    doc.text('Granular Skill & Concept Analysis', 14, finalY + 12);

    const skillRows = Object.entries(analytics.skillProficiency).map(([skill, stats]) => [
      skill,
      `${stats.attempted}`,
      `${stats.accuracyPercent}%`,
      `${stats.averageTimeSeconds}s`,
      stats.accuracyPercent >= 80 ? 'Mastered' : stats.accuracyPercent >= 50 ? 'Review Needed' : 'Priority Remediation'
    ]);

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Skill / Standard', 'Attempts', 'Accuracy', 'Avg Time', 'Recommendation']],
      body: skillRows.length > 0 ? skillRows.slice(0, 8) : [['Systems of two linear equations in two variables', '0', '0%', '0s', 'Start Practice']],
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85], // Slate 700
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkTextColor
      },
      margin: { left: 14, right: 14 }
    });
  }

  // 6. Actionable Practice Recommendations
  const nextY = (doc as any).lastAutoTable?.finalY || 190;
  if (nextY < 240 && options.includeRecommendations !== false) {
    doc.setFillColor(240, 253, 244); // Light green
    doc.roundedRect(14, nextY + 8, 182, 28, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, nextY + 8, 182, 28, 2, 2, 'D');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // Dark Green
    doc.text('Actionable Target Recommendations for Next Drill:', 18, nextY + 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const weakSkill = analytics.weakestSkills[0]?.skill || 'Systems of two linear equations in two variables';
    doc.text(`• Focus next 10-minute sprint on "${weakSkill}" to boost accuracy.`, 18, nextY + 21);
    doc.text(`• Practice translating word problems into slope-intercept form (y = mx + b) and linear inequality systems.`, 18, nextY + 26);
    doc.text(`• Use step-by-step hint levels to reinforce concept structure before revealing full rationales.`, 18, nextY + 31);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...grayTextColor);
  doc.text('PSAT Practice & Mastery Platform — Official College Board Format Aligned', 14, 288);
  doc.text(`Page 1 of 1`, 185, 288);

  // Save the PDF
  const filename = `PSAT_Report_${(options.studentName || 'Student').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
