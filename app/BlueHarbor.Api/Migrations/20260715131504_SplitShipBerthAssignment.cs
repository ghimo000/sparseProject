using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlueHarbor.Api.Migrations
{
    /// <inheritdoc />
    public partial class SplitShipBerthAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BerthName",
                table: "Ships");

            migrationBuilder.RenameColumn(
                name: "ArrivalDay",
                table: "Ships",
                newName: "RequestedArrivalDay");

            migrationBuilder.CreateTable(
                name: "BerthAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShipId = table.Column<int>(type: "int", nullable: false),
                    BerthName = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    StartDay = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BerthAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BerthAssignments_Ships_ShipId",
                        column: x => x.ShipId,
                        principalTable: "Ships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BerthAssignments_ShipId",
                table: "BerthAssignments",
                column: "ShipId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BerthAssignments");

            migrationBuilder.RenameColumn(
                name: "RequestedArrivalDay",
                table: "Ships",
                newName: "ArrivalDay");

            migrationBuilder.AddColumn<string>(
                name: "BerthName",
                table: "Ships",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);
        }
    }
}
