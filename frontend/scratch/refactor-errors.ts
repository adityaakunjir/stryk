import { Project, SyntaxKind } from "ts-morph";

async function main() {
  const project = new Project();
  project.addSourceFilesAtPaths("app/api/**/*.ts");

  let updatedCount = 0;

  project.getSourceFiles().forEach(sourceFile => {
    let changed = false;
    
    // Make sure NextResponse is imported
    const imports = sourceFile.getImportDeclarations();
    const hasNextResponse = imports.some(imp => 
      imp.getModuleSpecifierValue() === "next/server" && 
      imp.getNamedImports().some(ni => ni.getName() === "NextResponse")
    );

    // Get all function declarations (GET, POST, PATCH, etc)
    const functions = sourceFile.getFunctions();
    
    // Check if there's a top level try/catch in each exported function
    functions.forEach(func => {
      if (!func.isExported()) return;
      
      const body = func.getBody();
      if (!body || body.getKind() !== SyntaxKind.Block) return;
      
      const statements = body.asKind(SyntaxKind.Block)?.getStatements();
      if (!statements) return;

      // Ensure the function has a try/catch block
      const hasTryStatement = statements.some(stmt => stmt.getKind() === SyntaxKind.TryStatement);
      
      // If no try statement at all, we might need to wrap the whole body, but usually they already have it.
      // We will only modify existing CatchClauses here to standardise them.
    });

    const catchClauses = sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause);
    
    catchClauses.forEach(catchClause => {
      const bodyText = catchClause.getBlock().getText();
      
      // Do not touch Invalid JSON payload handlers (400 errors)
      if (bodyText.includes("Invalid JSON") || bodyText.includes("status: 400") || bodyText.includes("status: 404") || bodyText.includes("status: 401") || bodyText.includes("status: 403")) {
        return;
      }
      
      const errorName = catchClause.getVariableDeclaration()?.getName() || "error";
      
      catchClause.getBlock().replaceWithText(`{
    console.error("API ROUTE ERROR:", ${errorName});
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }`);
      changed = true;
    });

    if (changed) {
      if (!hasNextResponse) {
         sourceFile.addImportDeclaration({
             moduleSpecifier: "next/server",
             namedImports: [{ name: "NextResponse" }]
         });
      }
      sourceFile.saveSync();
      updatedCount++;
      console.log(`✅ Standardized error handling in: ${sourceFile.getBaseName()}`);
    }
  });

  console.log(`\n🎉 Successfully standardized ${updatedCount} API route files!`);
}

main().catch(console.error);
