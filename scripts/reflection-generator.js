#!/usr/bin/env node

/**
 * Cortex AI Reflection Generator
 * Automatically generates reflection records based on system events
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ReflectionGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, '../internal/experiences/templates/system-reflection.md');
    this.outputDir = path.join(__dirname, '../internal/experiences/daily');
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.outputDir,
      path.dirname(this.templatePath)
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-');
  }

  readTemplate() {
    try {
      return fs.readFileSync(this.templatePath, 'utf8');
    } catch (error) {
      console.error(chalk.red('Error reading template:'), error.message);
      return this.getDefaultTemplate();
    }
  }

  getDefaultTemplate() {
    return `# System Reflection Record

**Date**: ${this.getCurrentDate()}  
**Type**: [Daily/Weekly/Monthly/Incident]  
**Severity**: [Low/Medium/High/Critical]  

## **🎯 Reflection Context**

### **What Happened**
- Brief description of the event, decision, or interaction
- Key actions taken and their outcomes
- Important observations and patterns

### **Why It Matters**
- Impact on system performance
- Relevance to our core intents
- Connection to user experience

## **🔍 Deep Analysis**

### **Success Factors**
- What worked well and why
- Patterns that led to positive outcomes
- Behaviors that should be reinforced

### **Failure Points**
- What didn't work and why
- Root causes of problems
- Systemic issues identified

### **Learning Opportunities**
- New insights gained
- Patterns discovered
- Knowledge gaps identified

## **📚 Knowledge Extraction**

### **Pattern Recognition**
- Recurring themes or behaviors
- Similar situations from the past
- Predictive indicators

### **Rule Validation**
- Which rules worked effectively
- Which rules need adjustment
- New rules that should be created

### **System Behavior**
- How the system responded
- Alignment with intent specifications
- Deviations from expected behavior

## **🛠️ Action Items**

### **Immediate Actions**
- [ ] Specific tasks to complete today
- [ ] Quick fixes needed
- [ ] Urgent improvements

### **Short-term Improvements**
- [ ] Changes to implement this week
- [ ] Process improvements
- [ ] Documentation updates

### **Long-term Evolution**
- [ ] Strategic changes needed
- [ ] System architecture improvements
- [ ] Fundamental behavior modifications

## **📊 Metrics & Impact**

### **Quantitative Measures**
- Performance metrics affected
- Error rates or success rates
- Time efficiency changes

### **Qualitative Assessment**
- User satisfaction impact
- System reliability changes
- Learning effectiveness

### **System Health**
- Overall system stability
- Rule compliance rates
- Intent alignment scores

## **🔄 Integration**

### **Knowledge Sharing**
- How this learning should be shared
- Who needs to know about this
- Integration with existing knowledge

### **Rule Updates**
- Which rules need modification
- New rules to create
- Rules to deprecate

### **System Evolution**
- How this affects our evolution path
- Changes to intent specifications
- Updates to behavior guidelines

## **🎯 Next Steps**

### **Follow-up Actions**
- [ ] Schedule follow-up review
- [ ] Monitor specific metrics
- [ ] Plan next iteration

### **Prevention Strategy**
- [ ] How to prevent similar issues
- [ ] Early warning indicators
- [ ] Proactive measures

### **Continuous Learning**
- [ ] How to apply this learning
- [ ] Integration with daily practices
- [ ] Knowledge preservation

---

**Status**: [In Progress/Completed/Follow-up Required]  
**Next Review**: ${this.getCurrentDate()}  
**Related Files**: 
- \`internal/ai-collaboration/intent-specification.md\`
- \`docs/ai-collaboration/roles/\`
- \`.cursor/rules/cortex.mdc\`

**Tags**: [reflection, learning, system-evolution, intent-alignment]`;
  }

  generateReflection(type = 'Daily', severity = 'Medium', title = '') {
    const template = this.readTemplate();
    const date = this.getCurrentDate();
    const timestamp = this.getTimestamp();
    
    let filename = `${date}-reflection`;
    if (title) {
      filename += `-${title.toLowerCase().replace(/\s+/g, '-')}`;
    }
    filename += '.md';
    
    const outputPath = path.join(this.outputDir, filename);
    
    // Replace template placeholders
    let content = template
      .replace(/YYYY-MM-DD/g, date)
      .replace(/\[Daily\/Weekly\/Monthly\/Incident\]/, `[${type}]`)
      .replace(/\[Low\/Medium\/High\/Critical\]/, `[${severity}]`)
      .replace(/Status.*\[In Progress\/Completed\/Follow-up Required\]/, `Status: [In Progress]`)
      .replace(/Next Review.*YYYY-MM-DD/, `Next Review: ${date}`);
    
    // Add title if provided
    if (title) {
      content = content.replace('# System Reflection Record', `# System Reflection Record: ${title}`);
    }
    
    try {
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log(chalk.green(`✅ Reflection record created: ${filename}`));
      console.log(chalk.blue(`📁 Location: ${outputPath}`));
      return outputPath;
    } catch (error) {
      console.error(chalk.red('Error writing reflection file:'), error.message);
      return null;
    }
  }

  generateIncidentReflection(incident, severity = 'Medium') {
    const title = incident.replace(/\s+/g, '-').toLowerCase();
    return this.generateReflection('Incident', severity, incident);
  }

  generateDailyReflection() {
    return this.generateReflection('Daily', 'Low');
  }

  generateWeeklyReflection() {
    return this.generateReflection('Weekly', 'Medium');
  }

  generateMonthlyReflection() {
    return this.generateReflection('Monthly', 'High');
  }

  listReflections() {
    try {
      const files = fs.readdirSync(this.outputDir);
      const reflectionFiles = files.filter(file => file.endsWith('.md') && file !== 'README.md');
      
      if (reflectionFiles.length === 0) {
        console.log(chalk.yellow('No reflection records found.'));
        return [];
      }
      
      console.log(chalk.blue('📚 Reflection Records:'));
      reflectionFiles.forEach(file => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        console.log(chalk.gray(`  ${file} (${stats.mtime.toLocaleDateString()})`));
      });
      
      return reflectionFiles;
    } catch (error) {
      console.error(chalk.red('Error listing reflections:'), error.message);
      return [];
    }
  }
}

// CLI Interface
function main() {
  const generator = new ReflectionGenerator();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.blue('🧠 Cortex AI Reflection Generator'));
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log('  node reflection-generator.js daily                    # Generate daily reflection');
    console.log('  node reflection-generator.js weekly                   # Generate weekly reflection');
    console.log('  node reflection-generator.js monthly                  # Generate monthly reflection');
    console.log('  node reflection-generator.js incident "Title"         # Generate incident reflection');
    console.log('  node reflection-generator.js list                     # List existing reflections');
    console.log('');
    console.log(chalk.yellow('Examples:'));
    console.log('  node reflection-generator.js incident "Dogfooding Failure"');
    console.log('  node reflection-generator.js daily');
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'daily':
      generator.generateDailyReflection();
      break;
    case 'weekly':
      generator.generateWeeklyReflection();
      break;
    case 'monthly':
      generator.generateMonthlyReflection();
      break;
    case 'incident':
      if (args.length < 2) {
        console.error(chalk.red('Error: Incident title required'));
        console.log('Usage: node reflection-generator.js incident "Title"');
        return;
      }
      const title = args.slice(1).join(' ');
      generator.generateIncidentReflection(title);
      break;
    case 'list':
      generator.listReflections();
      break;
    default:
      console.error(chalk.red(`Unknown command: ${command}`));
      console.log('Run without arguments to see usage.');
  }
}

if (require.main === module) {
  main();
}

module.exports = ReflectionGenerator; 